import { createContext, ReactNode, useContext } from "react";
import { StatefulComponent } from "@macrostrat/ui-components";
import h from "../hyper";

import { hasSpan } from "./utils";
import { FlexibleNode, Force, Node, Renderer } from "./label-primitives";
import {
  ColumnContext,
  ColumnCtx,
  ColumnDivision,
  ColumnLayoutProvider,
} from "../context";
import {
  AgeRangeRelationship,
  compareAgeRanges,
} from "@macrostrat/stratigraphy-utils";

const NoteLayoutContext = createContext(null);

const buildColumnIndex = function () {
  /*
   * Find out where on the X axis arrows,
   * etc. should plot to aviod overlaps
   */
  const heightTracker = [];
  return function (note) {
    let colIx = 0;
    // Get column that note should render in
    const nPossibleCols = heightTracker.length + 1;
    for (
      let column = 0, end = nPossibleCols, asc = 0 <= end;
      asc ? column <= end : column >= end;
      asc ? column++ : column--
    ) {
      if (heightTracker[column] == null) {
        heightTracker[column] = note.height;
      }
      if (heightTracker[column] < note.height) {
        const hy = note.top_height || note.height;
        heightTracker[column] = hy;
        colIx = column;
        break;
      }
    }
    return colIx;
  };
};

function withinDomain(scale) {
  const scaleDomain = scale.domain();
  const d1: [number, number] = [
    Math.min(...scaleDomain),
    Math.max(...scaleDomain),
  ];
  return (d) => {
    const noteRange: [number, number] = [d.height, d.top_height ?? d.height];
    const rel = compareAgeRanges(d1, noteRange);

    return rel !== AgeRangeRelationship.Disjoint;
  };
}

interface NoteLayoutProviderProps {
  notes: any[];
  width: number;
  paddingLeft: number;
  noteComponent: any;
  forceOptions: object;
  children?: ReactNode;
}

interface NoteLayoutState {
  notes?: any[];
  elementHeights?: object;
  columnIndex?: object;
  nodes?: object;
  updateHeight?: Function;
  generatePath: Function;
  createNodeForNote?: Function;
  noteComponent?: any;
  renderer?: typeof Renderer;
}

export interface NoteLayoutCtx {
  renderer: typeof Renderer;
  paddingLeft: number;
  scale: Function;
  width: number;
  updateHeight: Function;
  generatePath: Function;
  columnIndex?: any;
  nodes?: any;
}

class NoteLayoutProvider extends StatefulComponent<
  NoteLayoutProviderProps,
  NoteLayoutState
> {
  static contextType = ColumnContext;
  static defaultProps = {
    paddingLeft: 60,
    estimatedTextHeight(note, width) {
      const txt = note.note || "";
      return 12;
    },
  };
  declare context: ColumnCtx<ColumnDivision>;
  _previousScale: any;
  _rendererIndex: object;
  /** The note set `nodes` was laid out for */
  _layoutNotes: any[] | null;

  constructor(props) {
    super(props);
    this.computeContextValue = this.computeContextValue.bind(this);
    this.savedRendererForWidth = this.savedRendererForWidth.bind(this);
    this.generatePath = this.generatePath.bind(this);
    this.createNodeForNote = this.createNodeForNote.bind(this);
    this.computeForceLayout = this.computeForceLayout.bind(this);
    this.updateHeight = this.updateHeight.bind(this);
    this.updateNotes = this.updateNotes.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    // State is very minimal to start
    const { noteComponent } = this.props;
    this.state = {
      notes: [],
      elementHeights: {},
      columnIndex: {},
      nodes: {},
      generatePath: this.generatePath,
      createNodeForNote: this.createNodeForNote,
      noteComponent,
    };
  }

  render() {
    const { children, width } = this.props;
    return h(
      NoteLayoutContext.Provider,
      { value: this.state },
      h(ColumnLayoutProvider, { width }, children),
    );
  }

  computeContextValue() {
    const { width, paddingLeft } = this.props;
    // Clamp notes to within scale boundaries
    // (we could turn this off if desired)
    const { scaleClamped: scale } = this.context;

    const forwardedValues = {
      // Forwarded values from column context
      // There may be a more elegant way to do this
      paddingLeft,
      scale,
      width,
    };

    // Compute force layout
    const renderer = new Renderer({
      direction: "right",
      layerGap: paddingLeft,
      nodeHeight: 5,
    });

    return this.setState({
      renderer,
      updateHeight: this.updateHeight,
      generatePath: this.generatePath,
      ...forwardedValues,
    });
  }

  savedRendererForWidth(width) {
    if (this._rendererIndex == null) {
      this._rendererIndex = {};
    }
    if (this._rendererIndex[width] == null) {
      this._rendererIndex[width] = new Renderer({
        direction: "right",
        layerGap: width,
        nodeHeight: 5,
      });
    }
    return this._rendererIndex[width];
  }

  generatePath(node, pixelOffset) {
    const { paddingLeft } = this.props;
    const renderer = this.savedRendererForWidth(paddingLeft - pixelOffset);
    try {
      return renderer.generatePath(node);
    } catch (err) {
      return null;
    }
  }

  createNodeForNote(note) {
    const { notes, elementHeights } = this.state;
    let { scaleClamped: scale } = this.context;
    const { id: noteID } = note;
    const pixelHeight = elementHeights[noteID] || 10;
    const padding = 5;
    let noteHeight = scale(note.height);
    if (hasSpan(note)) {
      const upperHeight = scale(note.top_height);
      const harr: [number, number] = [
        noteHeight - padding,
        upperHeight + padding,
      ];
      if (harr[0] - harr[1] > 0) {
        return new FlexibleNode(harr, pixelHeight);
      }
      noteHeight = (harr[0] + harr[1]) / 2;
    }
    return new Node(noteHeight, pixelHeight);
  }

  computeForceLayout(force = false) {
    let { notes, nodes } = this.state;
    const { pixelHeight } = this.context;
    const { forceOptions } = this.props;

    if (notes.length === 0) {
      return;
    }
    // Skip if node positions are already computed for *this* note set — unless
    // `force` is set (e.g. the scale changed on zoom and positions, which
    // derive from `scale(note.height)`, must be recomputed). The note set is
    // identified by the array itself: counting nodes can't tell one column's
    // notes from another's when both have the same number.
    const alreadyComputed =
      this._layoutNotes === notes && Object.keys(nodes).length === notes.length;
    if (!force && alreadyComputed) {
      return;
    }

    const force_ = new Force({
      minPos: 0,
      maxPos: pixelHeight,
      nodeSpacing: 0,
      ...forceOptions,
    });

    const dataNodes = notes.map(this.createNodeForNote);

    this._layoutNotes = notes;
    force_.nodes(dataNodes).compute();
    const _nodes = force_.nodes() ?? [];
    const nodesObj = {};
    for (let i = 0; i < _nodes.length; i++) {
      const node = _nodes[i];
      const note = notes[i];
      nodesObj[note.id] = node;
    }

    return this.updateState({ nodes: { $set: nodesObj } });
  }

  updateHeight(id, height) {
    if (height == null) {
      return;
    }
    /** Through the updater, not from `this.state`: every note measures itself
     * in the same tick, so each would build its new object from the same
     * pre-measurement copy and the last one would be the only height kept.
     * The layout would then place all of them at the 10px guess — which is
     * what it did, until labels of two lines had no room to be two lines.
     *
     * A new object each time, so `componentDidUpdate` can see that heights
     * changed and re-run the force layout with the measured sizes.
     */
    this.setState((prevState) => {
      const { elementHeights } = prevState;
      if (elementHeights[id] === height) return null;
      return { elementHeights: { ...elementHeights, [id]: height } };
    });
  }

  updateNotes() {
    // We received a new set of notes from props, or the scale changed under
    // the ones we have
    const { scaleClamped } = this.context;
    const notes = this.props.notes
      .filter(withinDomain(scaleClamped))
      .sort((a, b) => a.height - b.height);
    const columnIndex = notes.map(buildColumnIndex());
    // `computeForceLayout` reads the notes from state, so the layout can only
    // run once this has landed — on the next update, where the note set's new
    // identity makes the guard recompute it
    return this.setState({ notes, columnIndex });
  }

  /*
   * Lifecycle methods
   */
  componentDidMount() {
    this._previousScale = null;
    this._layoutNotes = null;
    this.updateNotes();
    return this.computeContextValue();
  }

  componentDidUpdate(prevProps, prevState) {
    const notesChanged = this.props.notes !== prevProps.notes;
    // The column scale gets a new identity when the column zooms. Note positions
    // derive from `scale(note.height)`, so a scale change must re-filter the
    // notes to the visible domain and force a re-layout.
    const scale = this.context?.scaleClamped;
    const scaleChanged = scale !== this._previousScale;

    const { noteComponent } = this.props;
    if (noteComponent !== prevProps.noteComponent) {
      this.setState({ noteComponent });
    }

    // Node positions are computed once per note set (the guard inside skips
    // when they already are); they must be recomputed when the scale changed —
    // the old code skipped that, leaving a "forest" of overlapping notes when
    // zoomed out — and when a note's rendered height was measured, since the
    // first layout runs on a 10px guess and notes taller than that (tags,
    // multi-line labels) would otherwise overlap.
    const heightsChanged =
      this.state.elementHeights !== prevState.elementHeights;

    if (notesChanged || scaleChanged) {
      // Re-filter to the visible domain. Laying out here would use the note
      // set this replaces, so it waits for the next update — which this
      // `setState` guarantees.
      this.updateNotes();
    } else {
      this.computeForceLayout(heightsChanged);
    }

    if (scaleChanged) {
      this.computeContextValue();
      this._previousScale = scale;
    }
  }
}

function NoteRect(props) {
  let { padding, width, ...rest } = props;
  if (padding == null) {
    padding = 5;
  }
  const { pixelHeight } = useContext(ColumnContext);
  if (width == null) {
    ({ width } = useContext(NoteLayoutContext));
  }
  if (isNaN(width)) {
    return null;
  }

  return h("rect", {
    width: width + 2 * padding,
    height: pixelHeight,
    transform: `translate(${-padding},${-padding})`,
    ...rest,
  });
}

const NoteUnderlay = function ({ ...rest }) {
  return h(NoteRect, {
    className: "underlay",
    ...rest,
  });
};

export function useNoteLayout() {
  const ctx = useContext(NoteLayoutContext);
  if (ctx == null) {
    throw new Error("useNoteLayout must be used within a NoteLayoutProvider");
  }
  return ctx;
}

export { NoteLayoutContext, NoteLayoutProvider, NoteRect, NoteUnderlay };
