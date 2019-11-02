import {Component} from "react"
import h from "@macrostrat/hyper"
import T from "prop-types"
import {NotesList} from './note'
import NoteDefs from './defs'
import {NoteShape} from './types'
import {NoteLayoutProvider} from './layout'
import {EditableText} from "@blueprintjs/core"

NoteEditor = (props)->
  {note} = props
  {note: text, id} = note
  h EditableText, {
    multiline: true
    className: 'note-label'
    defaultValue: text
    onConfirm: (newText)=>
      props.editHandler(id, newText)
  }

NoteEditor.propTypes = {
  editHandler: T.func.isRequired
  note: NoteShape.isRequired
}

NoteComponent = (props)->
  {note, editable} = props
  editable ?= false
  {note: text} = note
  if not props.editHandler?
    editable = false
  visibility = if editable then 'hidden' else 'inherit'
  h [
    h.if(editable) NoteEditor, props
    h 'p.note-label', {
      style: {visibility}
      xmlns: "http://www.w3.org/1999/xhtml"
    }, text
  ]

NoteComponent.propTypes = {
  editHandler: T.func
  note: NoteShape.isRequired
}

class NotesColumn extends Component
  @defaultProps: {
    type: 'log-notes'
    paddingLeft: 60
    inEditMode: false
    noteComponent: NoteComponent
  }
  @propTypes: {
    notes: T.arrayOf(NoteShape).isRequired
    width: T.number.isRequired
    paddingLeft: T.number
    onUpdateNote: T.func
    inEditMode: T.bool
    noteComponent: T.elementType
  }
  render: ->
    {width,
     paddingLeft,
     transform,
     notes,
     inEditMode
     onUpdateNote
     noteComponent
    } = @props

    editHandler = onUpdateNote
    if not inEditMode
      editHandler = null

    innerWidth = width-paddingLeft

    h NoteLayoutProvider, {
      notes
      width: innerWidth
      paddingLeft
      noteComponent
    }, [
      h 'g.section-log', {transform}, [
        h NoteDefs
        h NotesList, {
          editHandler
          inEditMode
        }
      ]
    ]

export {NotesColumn, NoteComponent, NoteEditor}
