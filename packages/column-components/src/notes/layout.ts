import { createContext, ReactNode, useContext } from "react";
import { StatefulComponent } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";

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
  return (d) => {
    const noteRange: [number, number] = [d.height, d.top_height ?? d.height];

    const rel = compareAgeRanges(scaleDomain, noteRange);

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
  context: ColumnCtx<ColumnDivision>;
  _previousContext: ColumnCtx<ColumnDivision>;
  _rendererIndex: object;

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

  computeForceLayout(prevProps, prevState) {
    let { notes, nodes, elementHeights } = this.state;
    const { pixelHeight } = this.context;
    const { width, paddingLeft, forceOptions } = this.props;

    if (notes.length === 0) {
      return;
    }
    // Something is wrong...
    //return if elementHeights.length < notes.length
    // Return if we've already computed nodes
    const v1 = Object.keys(nodes).length === notes.length;
    if (prevState == null) {
      prevState = {};
    }
    const v2 = elementHeights === prevState.elementHeights || [];
    if (v1 && v2) {
      return;
    }

    const force = new Force({
      minPos: 0,
      maxPos: pixelHeight,
      nodeSpacing: 0,
      ...forceOptions,
    });

    const dataNodes = notes.map(this.createNodeForNote);

    force.nodes(dataNodes).compute();
    const _nodes = force.nodes() ?? [];
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
    const { elementHeights } = this.state;
    elementHeights[id] = height;
    return this.updateState({ elementHeights: { $set: elementHeights } });
  }

  updateNotes() {
    // We received a new set of notes from props
    const { scaleClamped } = this.context;
    const notes = this.props.notes
      .filter(withinDomain(scaleClamped))
      .sort((a, b) => a.height - b.height);
    const columnIndex = notes.map(buildColumnIndex());
    return this.setState({ notes, columnIndex });
  }

  /*
   * Lifecycle methods
   */
  componentDidMount() {
    this._previousContext = null;
    this.updateNotes();
    return this.computeContextValue();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.notes !== prevProps.notes) {
      this.updateNotes();
    }

    // Update note component
    const { noteComponent } = this.props;
    if (noteComponent !== prevProps.noteComponent) {
      this.setState({ noteComponent });
    }
    this.computeForceLayout.call(prevProps, prevState);
    if (this.props.notes === prevProps.notes) {
      return;
    }
    if (this.context === this._previousContext) {
      return;
    }
    this.computeContextValue();
    return (this._previousContext = this.context);
  }
}

const NoteRect = function (props) {
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
};

const NoteUnderlay = function ({ fill, ...rest }) {
  if (fill == null) {
    fill = "transparent";
  }
  return h(NoteRect, {
    className: "underlay",
    fill,
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
