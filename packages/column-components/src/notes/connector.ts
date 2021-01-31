import { useContext, forwardRef } from "react"
import h from "../hyper"
import { NoteLayoutContext } from "./layout"
import { HeightRangeAnnotation } from "./height-range"
import { ForeignObject } from "../util"

const NotePositioner = forwardRef(function (props, ref) {
  let { offsetY, noteHeight, children } = props
  const { width, paddingLeft } = useContext(NoteLayoutContext)
  if (noteHeight == null) {
    noteHeight = 0
  }
  const outerPad = 5

  let y = offsetY - noteHeight / 2 - outerPad

  // HACK: override y position for Safari
  // (foreign objects don't work too well)
  if (navigator.userAgent.includes("Safari")) {
    y += 5
  }

  return h(
    ForeignObject,
    {
      width: width - paddingLeft + 2 * outerPad,
      x: paddingLeft - outerPad,
      y,
      height: noteHeight + 2 * outerPad,
      style: { overflowY: "visible" },
    },
    [
      h(
        "div.note-inner",
        {
          ref,
          style: { margin: outerPad },
        },
        children
      ),
    ]
  )
})

const findIndex = function (note) {
  const { notes } = useContext(NoteLayoutContext)
  return notes.indexOf(note)
}

const NoteConnector = function (props) {
  let { note, node, index } = props
  // Try to avoid scanning for index if we can
  if (index == null) {
    index = findIndex(note)
  }
  const { nodes, columnIndex, generatePath } = useContext(NoteLayoutContext)
  const { height, top_height } = note

  if (node == null) {
    node = nodes[note.id]
  }
  const offsetX = (columnIndex[index] || 0) * 5

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
  ])
}

export { NotePositioner, NoteConnector }
