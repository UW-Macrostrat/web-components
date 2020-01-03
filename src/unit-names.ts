import h from '@macrostrat/hyper'
import {
  ColumnContext
  NotesColumn
} from './column-components'
import {useContext, ColumnContext} from 'react'

interface UnitNamesProps {
  left?: number
}

const NoteComponent = (props)=>{
  const {note} = props
  const text = note.note
  return h('p.note-label', text)
}

const UnitNamesColumn = (props: UnitNamesProps)=>{
  const {left, ...rest} = props
  const {divisions} = useContext(ColumnContext)

  const notes = divisions.map((div,i) =>{
    return {
      height: div.b_age
      top_height: div.t_age
      note: div.unit_name.replace("Mbr", "Member").replace("Fm", "Formation").replace("Gp", "Group")
      id: i
    }
  })

  return h(NotesColumn, {
    transform: `translate(${left || 0})`
    editable: false,
    noteComponent: NoteComponent
    notes,
    forceOptions: {
      nodeSpacing: 1
    }
    ...rest
  })
}

export default UnitNamesColumn
