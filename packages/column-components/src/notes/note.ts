import { useContext, useMemo, useEffect, useRef, useState } from "react";
import h from "../hyper";
import { useNoteLayout } from "./layout";
import { NoteEditorContext } from "./editor";
import type { NoteData } from "./types";
import {
  NotePositioner,
  NoteConnector,
  NodeConnectorOptions,
} from "./connector";

type NoteListProps = NodeConnectorOptions & {
  inEditMode?: boolean;
  editable?: boolean;
  onClickNote?: (note: NoteData) => void;
};

export function NotesList(props: NoteListProps) {
  let { inEditMode: editable, onClickNote, ...rest } = props;
  if (editable == null) {
    editable = false;
  }
  const {
    notes,
    nodes: nodeIndex,
    scale,
    updateHeight,
    noteComponent,
  } = useNoteLayout();

  const notesInfo = useMemo(
    () =>
      notes.map((note) => {
        const node = nodeIndex[note.id];
        const pixelHeight = node?.width ?? 10;
        const pixelOffset = node?.currentPos ?? scale(note.top_height);
        return { note, node, pixelOffset, pixelHeight };
      }),
    [notes, nodeIndex, scale]
  );

  return h(
    "g",
    notesInfo.map(({ note, pixelOffset, pixelHeight }) => {
      return h(Note, {
        key: note.id,
        note,
        pixelOffset,
        pixelHeight,
        editable,
        updateHeight,
        onClick: onClickNote,
        noteBodyComponent: noteComponent,
        ...rest,
      });
    })
  );
}

type NodeInfo = any;

interface NoteProps {
  editable: boolean;
  note: NoteData;
  node: NodeInfo;
  editHandler?: Function;
  style?: object;
  deltaConnectorAttachment?: number;
  pixelOffset?: number;
  pixelHeight?: number;
  updateHeight?: (id: string | number, height: number) => void;
  onClick?: (note: NoteData) => void;
  noteBodyComponent: any;
}

function Note(props: NoteProps) {
  const {
    note,
    pixelOffset,
    pixelHeight,
    updateHeight,
    deltaConnectorAttachment,
    noteBodyComponent,
    onClick,
  } = props;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      const newHeight = ref.current.offsetHeight;
      if (newHeight !== pixelHeight) {
        updateHeight(note.id, newHeight);
      }
    }
  }, [note, pixelHeight, updateHeight]);

  const offsetY = pixelOffset;
  const noteHeight = pixelHeight;

  const { setEditingNote, editingNote } = useContext(NoteEditorContext) as any;
  const onClick_ = onClick ?? setEditingNote;
  const _onClickHandler = (evt) => {
    onClick_(note);
  };

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
        onClick: _onClickHandler,
      },
      h(noteBodyComponent, { note })
    ),
  ]);
}

export { NotePositioner, NoteConnector };
