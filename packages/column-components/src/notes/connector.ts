import { useContext, forwardRef, ReactNode } from "react";
import h from "../hyper";
import { NoteLayoutContext } from "./layout";
import { HeightRangeAnnotation } from "./height-range";
import { ForeignObject } from "../util";

interface NotePositionerProps {
  offsetY: number;
  noteHeight: number;
  children?: ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

const NotePositioner = forwardRef(function (
  props: NotePositionerProps,
  ref: any,
) {
  let { offsetY, noteHeight, onClick, children } = props;
  const { width, paddingLeft } = useContext(NoteLayoutContext);
  if (noteHeight == null) {
    noteHeight = 0;
  }
  const outerPad = 5;

  let y = offsetY - noteHeight / 2 - outerPad;

  return h(
    ForeignObject,
    {
      width: width - paddingLeft + 2 * outerPad,
      x: paddingLeft - outerPad,
      y,
      height: noteHeight + 2 * outerPad,
      overflow: "visible",
      style: { overflowY: "visible" },
    },
    [
      h(
        "div.note-inner",
        {
          ref,
          onClick,
        },
        children,
      ),
    ],
  );
});

const findIndex = function (note) {
  const { notes } = useContext(NoteLayoutContext);
  return notes.indexOf(note);
};

export interface NodeConnectorOptions {
  deltaConnectorAttachment?: number; // Delta for connector attachment
}

type NodeConnectorProps = NodeConnectorOptions & {
  note: any; // Note data type
  node?: any; // Node data type
  index?: number; // Index of the note in the layout
};

const NoteConnector = function (props: NodeConnectorProps) {
  let { note, node, deltaConnectorAttachment, index } = props;
  // Try to avoid scanning for index if we can
  if (index == null) {
    index = findIndex(note);
  }
  const { nodes, columnIndex, generatePath } = useContext(NoteLayoutContext);
  const { height, top_height } = note;

  if (node == null) {
    node = nodes[note.id];
  }

  if (node != null && deltaConnectorAttachment != null) {
    node.currentPos += deltaConnectorAttachment;
  }

  const offsetX = (columnIndex[index] || 0) * 5;

  return h([
    h(HeightRangeAnnotation, {
      offsetX,
      height,
      top_height,
    }),
    h("path.link.col-note-link", {
      d: generatePath(node, offsetX),
      transform: `translate(${offsetX})`,
    }),
  ]);
};

export { NotePositioner, NoteConnector };
