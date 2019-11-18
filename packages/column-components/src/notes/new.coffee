import {useState, useContext} from 'react'
import h from '../hyper'
import {NoteLayoutContext, NoteRect} from './layout'
import {NoteEditorContext} from './editor'
import {HeightRangeAnnotation} from './height-range'
import T from 'prop-types'

getHeights = (position, tolerance=0.1)->
  {startHeight, dragHeight, rest...} = position
  dragHeight ?= startHeight
  rng = [startHeight, dragHeight]
  Array.sort(rng)
  [height, top_height] = rng
  if top_height-height < tolerance
    top_height = null
  return {height, top_height, rest...}

HeightRange = (props)->
  {position, tolerance} = props
  return null unless position
  tolerance ?= 0.1
  val = getHeights position, tolerance
  h HeightRangeAnnotation, val

NewNotePositioner = (props)->
  {tolerance} = props
  [notePosition, setPosition] = useState(null)
  {paddingLeft, scale} = useContext(NoteLayoutContext)
  {editingNote} = useContext(NoteEditorContext)
  return null if editingNote?

  eventHeight = (evt)->
    scale.invert(evt.nativeEvent.offsetY)

  h 'g.new-note', [
    h NoteRect, {
      width: paddingLeft
      fill: 'transparent'
      padding: 0
      style: {cursor: 'drag'}
      onMouseDown: (evt)->
        return if notePosition?
        setPosition {
          startHeight: eventHeight(evt),
          offsetX: evt.nativeEvent.offsetX
        }
      onMouseMove: (evt)->
        return unless notePosition?
        setPosition {
          notePosition...
          dragHeight: eventHeight(evt)
        }

      onMouseUp: (evt)->
        dragHeight = eventHeight(evt)
        finalPos = getHeights({notePosition..., dragHeight})
        setPosition null
    }
    h HeightRange, {position: notePosition}
  ]

NewNotePositioner.defaultProps = {
  tolerance: 0.1
}

export {NewNotePositioner}
