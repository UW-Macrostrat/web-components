import {
  Component,
  useContext,
  createRef,
  forwardRef,
  RefObject,
  useMemo,
} from "react";
import h from "../hyper";
import { NoteLayoutContext, NoteLayoutCtx, useNoteLayout } from "./layout";
import { NoteEditorContext } from "./editor";
import type { NoteData } from "./types";
import {
  NotePositioner,
  NoteConnector,
  NodeConnectorOptions,
} from "./connector";

export function NotesList(props: NoteListProps) {
  let { inEditMode: editable, ...rest } = props;
  if (editable == null) {
    editable = false;
  }
  const { notes, nodes: nodeIndex, scale, updateHeight } = useNoteLayout();

  const notesInfo = useMemo(
    () =>
      notes.map((note) => {
        const node = nodeIndex[note.id];
        const pixelOffsetTop = scale(note.height);
        return { note, node, pixelOffsetTop };
      }),
    [notes, nodeIndex, scale]
  );

  return h(
    "g",
    notesInfo.map(({ note, node }) => {
      return h(Note, {
        key: note.id,
        note,
        node,
        editable,
        updateHeight,
        ...rest,
      });
    })
  );
}

const NoteBody = function (props) {
  const { note } = props;
  const { setEditingNote, editingNote } = useContext(NoteEditorContext) as any;
  const { noteComponent } = useContext(NoteLayoutContext);
  const isEditing = editingNote === note;

  const onClick = () => setEditingNote(note);

  const visibility = isEditing ? "hidden" : "inherit";
  return h(noteComponent, { visibility, note, onClick });
};

const NoteMain = forwardRef(function (props: any, ref) {
  const { note, offsetY, noteHeight, deltaConnectorAttachment } = props;
  const { editingNote } = useContext(NoteEditorContext) as any;
  if (editingNote === note) {
    return null;
  }
  return h("g.note", [
    h(NoteConnector, { note, deltaConnectorAttachment }),
    h(
      NotePositioner,
      {
        offsetY,
        noteHeight,
        ref,
      },
      [h(NoteBody, { note })]
    ),
  ]);
});

type NodeInfo = any;

interface NoteProps {
  editable: boolean;
  note: NoteData;
  node: NodeInfo;
  editHandler: Function;
  style?: object;
  deltaConnectorAttachment?: number;
  pixelOffsetTop?: number;
}

class Note extends Component<NoteProps, any> {
  static contextType = NoteLayoutContext;
  element: RefObject<HTMLElement>;
  context: NoteLayoutCtx;

  constructor(props) {
    super(props);
    this._updateHeight = this._updateHeight.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.element = createRef();
    this.state = { height: null };
  }

  render() {
    const { note, node, pixelOffsetTop } = this.props;

    const offsetY = node?.currentPos ?? pixelOffsetTop;

    const noteHeight = this.state.height || 0;

    return h(NoteMain, {
      offsetY,
      note,
      noteHeight,
      ref: this.element,
      deltaConnectorAttachment: this.props.deltaConnectorAttachment,
    });
  }

  _updateHeight(prevProps) {
    const node = this.element.current;
    if (node == null) {
      return;
    }
    const height = node.offsetHeight;
    if (height == null) {
      return;
    }
    if (prevProps != null && prevProps.note === this.props.note) {
      return;
    }
    this.setState({ height });
    return this.context.updateHeight(this.props.note.id, height);
  }

  componentDidMount() {
    return this._updateHeight.apply(this, arguments);
  }

  componentDidUpdate() {
    return this._updateHeight.apply(this, arguments);
  }
}

type NoteListProps = NodeConnectorOptions & {
  inEditMode?: boolean;
  editable?: boolean;
};

export { NotePositioner, NoteConnector };
