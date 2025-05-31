import { ComponentType, useContext } from "react";
import h from "../hyper";
import { NotesList } from "./note";
import NoteDefs from "./defs";
import { NoteData } from "./types";
import { useModelEditor, ColumnContext } from "../context";
import { NoteLayoutProvider, NoteUnderlay } from "./layout";
import {
  NoteEditor,
  NoteTextEditor,
  NoteEditorContext,
  NoteEditorProvider,
} from "./editor";
import { NewNotePositioner } from "./new";
import { NodeConnectorOptions } from "./connector";
export * from "./types";

interface NoteComponentProps {
  visibility: string;
  note: NoteData;
  onClick: Function;
}

function NoteComponent(props: NoteComponentProps) {
  const { visibility, note, onClick } = props;
  const text = note.note;
  return h(
    "p.col-note-label",
    {
      style: { visibility },
      onClick,
    },
    text
  );
}

const CancelEditUnderlay = function () {
  const { setEditingNote } = useContext(NoteEditorContext) as any;
  const { confirmChanges } = useModelEditor();
  return h(NoteUnderlay, {
    onClick() {
      console.log("Clicked to cancel note editing");
      return setEditingNote(null);
    },
  });
};

interface EditableNotesColumnProps {
  width?: number;
  paddingLeft?: number;
  transform?: string;
  notes?: NoteData[];
  inEditMode?: boolean;
  onUpdateNote?: (n: NoteData) => void;
  onDeleteNote?: (n: NoteData) => void;
  onCreateNote?: Function;
  noteComponent?: ComponentType<any>;
  noteEditor?: ComponentType<any>;
  allowPositionEditing?: boolean;
  forceOptions?: object;
}

function EditableNotesColumn(props: EditableNotesColumnProps) {
  const {
    width,
    paddingLeft = 60,
    transform,
    notes,
    inEditMode = false,
    onUpdateNote,
    onDeleteNote,
    onCreateNote,
    noteComponent = NoteComponent,
    noteEditor = NoteTextEditor,
    allowPositionEditing = false,
    forceOptions,
  } = props;

  const innerWidth = width - paddingLeft;

  return h(
    NoteLayoutProvider,
    {
      notes,
      width: innerWidth,
      paddingLeft,
      noteComponent,
      forceOptions,
    },
    [
      h(
        NoteEditorProvider,
        {
          inEditMode,
          noteEditor,
          onCreateNote,
          onUpdateNote,
          onDeleteNote,
        },
        [
          h("g.section-log", { transform }, [
            h(NoteDefs),
            h(CancelEditUnderlay),
            h(NotesList, {
              editHandler: inEditMode ? onUpdateNote : null,
              inEditMode,
            }),
            h(NewNotePositioner),
            h(NoteEditor, { allowPositionEditing }),
          ]),
        ]
      ),
    ]
  );
}

interface NotesColumnBaseProps extends NodeConnectorOptions {
  width?: number;
  paddingLeft?: number;
  transform?: string;
  notes?: NoteData[];
  noteComponent?: ComponentType<any>;
}

function StaticNotesColumn(props: NotesColumnBaseProps) {
  /** A non-editable notes column. */
  const {
    width,
    paddingLeft = 60,
    transform,
    notes,
    noteComponent = NoteComponent,
    deltaConnectorAttachment,
    children,
  } = props;

  const innerWidth = width - paddingLeft;

  return h(
    NoteLayoutProvider,
    {
      notes,
      width: innerWidth,
      paddingLeft,
      noteComponent,
    },
    [
      h("g.section-log", { transform }, [
        h(NoteDefs),
        h(NotesList, { inEditMode: false, deltaConnectorAttachment }),
        children,
      ]),
    ]
  );
}

function NotesColumn(props) {
  const { editable = true, ...rest } = props;
  const ctx = useContext(ColumnContext);
  // not sure why we have this here.
  if (ctx?.scaleClamped == null) return null;

  const c: ComponentType = editable ? EditableNotesColumn : StaticNotesColumn;
  return h(c, rest);
}

interface NotesColumnProps {
  editable?: boolean;
}

export {
  NotesColumn,
  NoteComponent,
  NoteTextEditor,
  NoteEditor,
  NoteEditorContext,
  NotesColumnProps,
  StaticNotesColumn,
};
