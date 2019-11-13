import {NoteTextEditor} from '#'
import h from '~/hyper'
import {ContentPanel} from '../ui'
import {TextArea, InputGroup, Button} from '@blueprintjs/core'

NoteEditor = (props)->
  {note} = props
  h 'div.note-editor', [
    h ContentPanel, [
      h TextArea, {value: note.note, growVertically: true}
      h Button, {}, "Make span"
      h Button, {}, "Delete"
    ]
  ]

export {NoteEditor}
