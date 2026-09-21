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
  /** Pixels the connector continues past each end, so it meets what it points
   * at rather than stopping short of it: whatever marks the note's height in
   * the column on one side, the note body on the other. One number applies to
   * both ends; a pair is `[start, end]`. The continuation past the note body
   * is drawn under it. */
  connectorOverhang?: number | [number, number];
  /** Draw a marker at the note's height when the note has no extent
   * (default `true`). A note whose connector runs into something already
   * drawn at that height doesn't need one. */
  showPointMarker?: boolean;
}

type NodeConnectorProps = NodeConnectorOptions & {
  note: any; // Note data type
  node?: any; // Node data type
  index?: number; // Index of the note in the layout
};

const NoteConnector = function (props: NodeConnectorProps) {
  let {
    note,
    node,
    deltaConnectorAttachment,
    index,
    connectorOverhang = 0,
    showPointMarker = true,
  } = props;
  // Try to avoid scanning for index if we can
  if (index == null) {
    index = findIndex(note);
  }
  const { nodes, columnIndex, generatePath, paddingLeft } =
    useContext(NoteLayoutContext);
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
      showPointMarker,
    }),
    h("g.note-connector", { transform: `translate(${offsetX})` }, [
      ...connectorContinuations(node, paddingLeft - offsetX, connectorOverhang),
      h("path.link.col-note-link", { d: generatePath(node, offsetX) }),
    ]),
  ]);
};

/** Straight segments continuing the connector past each of its ends. The
 * connector runs from the note's position in the column (`idealPos`, where
 * the layout wanted it) to the note body (`currentPos`, where it fits), so
 * the continuations are horizontal at those two heights. */
function connectorContinuations(
  node: any,
  layerGap: number,
  overhang: number | [number, number],
) {
  if (node == null) return [];
  let start = overhang;
  let end = overhang;
  if (Array.isArray(overhang)) {
    [start, end] = overhang;
  }

  const segments = [];
  if (start > 0) {
    segments.push(
      h("line.link.connector-continuation", {
        key: "start",
        x1: -start,
        x2: 0,
        y1: node.idealPos,
        y2: node.idealPos,
      }),
    );
  }
  // `layerGap` comes from the layout context, which is empty on first render
  if (end > 0 && Number.isFinite(layerGap)) {
    segments.push(
      h("line.link.connector-continuation", {
        key: "end",
        x1: layerGap,
        x2: layerGap + end,
        y1: node.currentPos,
        y2: node.currentPos,
      }),
    );
  }
  return segments;
}

export { NotePositioner, NoteConnector };
