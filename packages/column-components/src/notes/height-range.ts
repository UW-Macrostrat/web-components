/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { useContext } from "react"
import h from "../hyper"
import T from "prop-types"
import { NoteLayoutContext } from "./layout"

const HeightRangeAnnotation = function (props) {
  const { scale } = useContext(NoteLayoutContext)
  const { height, top_height, offsetX, color, ...rest } = props

  const bottomHeight = scale(height)
  let pxHeight = 0
  if (top_height != null) {
    pxHeight = Math.abs(scale(top_height) - bottomHeight)
  }
  const topHeight = bottomHeight - pxHeight

  const isLine = pxHeight > 5

  const transform = `translate(${offsetX},${topHeight})`

  return h("g.height-range", { transform, ...rest }, [
    h.if(isLine)("line", {
      x1: 0,
      x2: 0,
      y1: 2.5,
      y2: pxHeight - 2.5,
    }),
    h.if(!isLine)("circle", { r: 2 }),
  ])
}

HeightRangeAnnotation.propTypes = {
  height: T.number.isRequired,
  top_height: T.number,
  offsetX: T.number,
}

HeightRangeAnnotation.defaultProps = {
  offsetX: 0,
}

export { HeightRangeAnnotation }
