import {useContext} from 'react'
import h from "../hyper"
import T from 'prop-types'
import {NoteLayoutContext} from './layout'

HeightRangeAnnotation = (props)->
  {scale} = useContext(NoteLayoutContext)
  {height, top_height, offsetX, color, rest...} = props

  bottomHeight = scale(height)
  pxHeight = 0
  if top_height?
    pxHeight = Math.abs(scale(top_height)-bottomHeight)
  topHeight = bottomHeight-pxHeight

  isLine = pxHeight > 5

  transform = "translate(#{offsetX},#{topHeight})"

  h 'g.height-range', {transform, rest...}, [
    h.if(isLine) 'line', {
      x1: 0,
      x2: 0,
      y1: 2.5,
      y2: pxHeight-2.5
    }
    h.if(not isLine) 'circle', {r: 2}
  ]

HeightRangeAnnotation.propTypes = {
  height: T.number.isRequired
  top_height: T.number
  offsetX: T.number
}

HeightRangeAnnotation.defaultProps = {
  offsetX: 0
}

export {HeightRangeAnnotation}
