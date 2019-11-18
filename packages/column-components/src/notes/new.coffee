import {useState, useContext} from 'react'
import h from 'react-hyperscript'
import {NoteLayoutContext, NoteRect} from './layout'
import {NoteEditorContext} from './editor'

NewNotePositioner = (props)->
  [newNotePosition, setPosition] = useState(null)
  {paddingLeft} = useContext(NoteLayoutContext)
  {editingNote} = useContext(NoteEditorContext)
  return null if editingNote?
  h [
    h NoteRect, {
      className: 'new-note'
      width: paddingLeft
      fill: 'transparent'
      padding: 0
      style: {cursor: 'drag'}
      onMouseDown: (evt)->
        console.log evt
      onMouseUp: (evt)->
        console.log "Up!"
    }
  ]

export {NewNotePositioner}
