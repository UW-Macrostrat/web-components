import { ComponentType, useCallback, useContext, useState } from "react";
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
import type { ReactNode } from "react";

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
    text,
  );
}

const CancelEditUnderlay = function () {
  const { setEditingNote } = useContext(NoteEditorContext) as any;
  return h(NoteUnderlay, {
    onClick(evt) {
      setEditingNote(null);
      evt.stopPropagation();
    },
  });
};

interface NotesColumnBaseProps extends NodeConnectorOptions {
  width?: number;
  paddingLeft?: number;
  transform?: string;
  notes?: NoteData[];
  noteComponent?: ComponentType<any>;
  onClickNote?: (note: NoteData) => void;
  children?: ReactNode;
  forceOptions?: object;
}

interface EditableNotesColumnProps extends NotesColumnBaseProps {
  inEditMode?: boolean;
  onUpdateNote?: (n: NoteData) => void;
  onDeleteNote?: (n: NoteData) => void;
  onCreateNote?: Function;
  noteEditor?: ComponentType<any>;
  allowPositionEditing?: boolean;
}

interface FocusedNotesColumnProps extends NotesColumnBaseProps {
  focusedNote?: NoteData | null;
  onFocusNote?: (note: NoteData | null) => void;
  focusedNoteComponent?: ComponentType<any>;
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
    onClickNote,
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
              onClickNote,
            }),
            h(NewNotePositioner),
            h(NoteEditor, { allowPositionEditing }),
          ]),
        ],
      ),
    ],
  );
}

function FocusableNoteColumn(props: FocusedNotesColumnProps) {
  /** A notes column with selection capabilities. */
  const {
    width,
    paddingLeft = 60,
    transform,
    notes,
    forceOptions,
    noteComponent = NoteComponent,
    focusedNoteComponent = NoteComponent,
    deltaConnectorAttachment,
    onClickNote,
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
          inEditMode: true,
          noteEditor: focusedNoteComponent,
        },
        [
          h("g.section-log", { transform }, [
            h(NoteDefs),
            h(CancelEditUnderlay),
            h(NotesList, {
              onClickNote,
              deltaConnectorAttachment,
            }),
            h(NewNotePositioner),
            h(NoteEditor, { allowPositionEditing: false }),
          ]),
        ],
      ),
    ],
  );
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
    onClickNote,
    forceOptions,
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
      forceOptions,
    },
    [
      h("g.section-log", { transform }, [
        h(NoteDefs),
        h(NotesList, {
          deltaConnectorAttachment,
          onClickNote,
        }),
        children,
      ]),
    ],
  );
}

function NotesColumn(props: NotesColumnProps) {
  const { editable = false, ...rest } = props;
  const ctx = useContext(ColumnContext);
  // not sure why we have this here.
  if (ctx?.scaleClamped == null) return null;

  let c: ComponentType = StaticNotesColumn;
  if (editable) {
    c = EditableNotesColumn;
  } else if (rest.focusedNoteComponent != null) {
    c = FocusableNoteColumn;
  }
  return h(c, rest);
}

interface NotesColumnProps
  extends FocusedNotesColumnProps,
    EditableNotesColumnProps {
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
