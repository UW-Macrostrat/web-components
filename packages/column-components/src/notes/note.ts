import { Component, useContext, createRef, forwardRef, RefObject } from "react";
import h from "../hyper";
import { NoteLayoutContext, NoteLayoutCtx } from "./layout";
import { NoteEditorContext } from "./editor";
import type { NoteData } from "./types";
import { NotePositioner, NoteConnector } from "./connector";

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
  const { note, offsetY, noteHeight } = props;
  const { editingNote } = useContext(NoteEditorContext) as any;
  if (editingNote === note) {
    return null;
  }
  return h("g.note", [
    h(NoteConnector, { note }),
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

interface NoteProps {
  editable: boolean;
  note: NoteData;
  editHandler: Function;
  style?: object;
}

class Note extends Component<NoteProps, any> {
  static contextType = NoteLayoutContext;
  element: RefObject<HTMLElement>;
  context: NoteLayoutCtx;

  constructor(props) {
    super(props);
    this.updateHeight = this.updateHeight.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.element = createRef();
    this.state = { height: null };
  }

  render() {
    const { style, note, editHandler, editable } = this.props;
    const { scale, nodes, columnIndex, width, paddingLeft } = this.context;

    const node = nodes[note.id];
    let offsetY = scale(note.height);
    if (node != null) {
      offsetY = node.currentPos;
    }

    const noteHeight = this.state.height || 0;

    return h(NoteMain, {
      offsetY,
      note,
      noteHeight,
      ref: this.element,
    });
  }

  updateHeight(prevProps) {
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
    return this.context.registerHeight(this.props.note.id, height);
  }

  componentDidMount() {
    return this.updateHeight.apply(this, arguments);
  }

  componentDidUpdate() {
    return this.updateHeight.apply(this, arguments);
  }
}

const NotesList = function (props) {
  let { inEditMode: editable, ...rest } = props;
  if (editable == null) {
    editable = false;
  }
  const { notes } = useContext(NoteLayoutContext);
  return h(
    "g",
    notes.map((note) => {
      return h(Note, { key: note.id, note, editable, ...rest });
    })
  );
};

export { Note, NotesList, NotePositioner, NoteConnector };
