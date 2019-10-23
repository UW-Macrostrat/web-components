import {Component} from "react"
import h from "react-hyperscript"
import T from "prop-types"
import {ColumnContext} from '../context'
import {NotesList} from './note'
import NoteDefs from './defs'
import {NoteShape} from './types'
import {NoteLayoutProvider} from './layout'

class NotesColumn extends Component
  @contextType: ColumnContext
  @defaultProps: {
    type: 'log-notes'
    paddingLeft: 60
    inEditMode: false
  }
  @propTypes: {
    notes: T.arrayOf(NoteShape).isRequired
    width: T.number.isRequired
    paddingLeft: T.number
    onUpdateNote: T.func
  }
  render: ->
    {scale, zoom, pixelHeight: height} = @context
    {type,
     width,
     paddingLeft,
     transform,
     notes,
     inEditMode
    } = @props

    innerWidth = width-paddingLeft

    #notes = @notesData()

    width += 80

    h NoteLayoutProvider, {
      notes
      width: innerWidth
      paddingLeft
    }, [
      h 'g.section-log', {transform}, [
        h NoteDefs
        h NotesList, {
          editHandler: @props.editHandler
          inEditMode
        }
      ]
    ]

export {NotesColumn}
