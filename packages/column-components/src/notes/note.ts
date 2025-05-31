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
};

export function NotesList(props: NoteListProps) {
  let { inEditMode: editable, ...rest } = props;
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
        const pixelOffsetTop = scale(note.height);
        return { note, node, pixelOffsetTop };
      }),
    [notes, nodeIndex, scale]
  );

  return h(
    "g",
    notesInfo.map(({ note, node, pixelOffsetTop }) => {
      return h(Note, {
        key: note.id,
        note,
        node,
        pixelOffsetTop,
        editable,
        updateHeight,
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
  pixelOffsetTop?: number;
  updateHeight?: (id: string | number, height: number) => void;
  onClick?: (note: NoteData, evt: MouseEvent) => void;
  noteBodyComponent: any;
}

function Note(props: NoteProps) {
  const {
    note,
    node,
    pixelOffsetTop,
    updateHeight,
    deltaConnectorAttachment,
    noteBodyComponent,
  } = props;
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (ref.current) {
      const newHeight = ref.current.offsetHeight;
      if (newHeight !== height) {
        setHeight(newHeight);
        updateHeight(note.id, newHeight);
      }
    }
  }, [note, pixelOffsetTop, updateHeight]);

  const offsetY = node?.currentPos ?? pixelOffsetTop;
  const noteHeight = height || 0;

  const { setEditingNote, editingNote } = useContext(NoteEditorContext) as any;
  const isEditing = editingNote === note;
  const visibility = isEditing ? "hidden" : "inherit";
  const onClick = () => setEditingNote(note);

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
      h(noteBodyComponent, { visibility, note, onClick })
    ),
  ]);
}

export { NotePositioner, NoteConnector };
