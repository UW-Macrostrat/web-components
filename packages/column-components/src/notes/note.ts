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
import { useColumn } from "@macrostrat/column-components";

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
    updateHeight,
    noteComponent,
    scale,
  } = useNoteLayout();

  const { pixelHeight: columnHeight } = useColumn();

  const notesInfo = useMemo(() => {
    let notes1 = notes.map((note) => {
      const node = nodeIndex[note.id];
      const pixelHeight = node?.width ?? 10;
      const pixelOffset = node?.currentPos ?? scale(note.top_height);
      return {
        note,
        node,
        pixelOffset,
        pixelHeight,
        spacing: {
          above: pixelOffset - pixelHeight,
          below: columnHeight - pixelOffset,
        },
      };
    });

    // Adjust spacing to account for nearby nodes
    for (let i = 0; i < notes1.length; i++) {
      const { spacing, pixelOffset } = notes1[i];
      if (i > 0) {
        const prevNote = notes1[i - 1];
        // Get distance from the previous note's bottom
        // to the current note's top
        spacing.above =
          pixelOffset - prevNote.pixelOffset - prevNote.pixelHeight;
        prevNote.spacing.below = spacing.above;
      }
    }

    return notes1;
  }, [notes, nodeIndex, scale]);

  return h(
    "g",
    notesInfo.map(({ note, pixelOffset, pixelHeight, spacing }) => {
      return h(Note, {
        key: note.id,
        note,
        pixelOffset,
        pixelHeight,
        editable,
        updateHeight,
        onClick: onClickNote,
        noteBodyComponent: noteComponent,
        spacing,
        ...rest,
      });
    })
  );
}

type NodeSpacing = {
  above: number;
  below: number;
};

type NodeInfo = any;

interface NoteProps {
  editable: boolean;
  note: NoteData;
  editHandler?: Function;
  style?: object;
  deltaConnectorAttachment?: number;
  pixelOffset?: number;
  pixelHeight?: number;
  updateHeight?: (id: string | number, height: number) => void;
  onClick?: (note: NoteData) => void;
  noteBodyComponent: (props: { note: NoteData; spacing?: NodeSpacing }) => any;
  spacing?: NodeSpacing;
}

function Note(props: NoteProps) {
  const {
    note,
    pixelOffset,
    pixelHeight,
    updateHeight,
    deltaConnectorAttachment,
    noteBodyComponent,
    spacing,
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
      h(noteBodyComponent, { note, spacing })
    ),
  ]);
}

export { NotePositioner, NoteConnector };
