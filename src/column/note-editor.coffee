import {NoteTextEditor, useModelEditor} from '#'
import h from '~/hyper'
import {ContentPanel} from '../ui'
import {TextArea, InputGroup, Button} from '@blueprintjs/core'
import {format} from 'd3-format'

fmt = format("~s")

HeightRange = (props)->
  {formatter} = props
  formatter ?= fmt
  {height, top_height} = props.note
  h 'p.height', [
    h 'span.height', fmt(height)
    h.if(top_height?) [
      " – "
      h 'span.height', fmt(top_height)
    ]
    " m"
  ]

NoteEditor = (props)->
  {editedModel: note, updateModel} = useModelEditor()
  onChange = (event)->
    v = event.target.value
    updateModel {note: {$set: v}}

  h 'div.note-editor', [
    h ContentPanel, [
      h TextArea, {value: note.note, growVertically: true, onChange}
      h HeightRange, {note}
      h Button, {}, "Make span"
      h Button, {}, "Delete"
    ]
  ]

export {NoteEditor}
