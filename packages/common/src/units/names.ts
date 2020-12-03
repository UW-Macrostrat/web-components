import h from '@macrostrat/hyper'
import {useContext} from 'react'

import {
  ColumnContext
  NotesColumn
} from '@macrostrat/column-components'
//import {INote} from '@macrostrat/column-components/src/notes/index.d.ts'

interface UnitNamesProps {
  left?: number
  nameForDivision(object): string
}

const NoteComponent = (props)=>{
  const {note} = props
  const text = note.note
  return h('p.col-note-label', text)
}

const UnitNamesColumn = (props: UnitNamesProps)=>{
  const {left, nameForDivision, ...rest} = props
  const {divisions} = useContext(ColumnContext)

  const notes: INote[] = divisions.map((div,i) =>{
    return {
      height: div.b_age
      top_height: div.t_age
      note: nameForDivision(div)
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

UnitNamesColumn.defaultProps = {
  nameForDivision: (div)=>{
    return div.unit_name
      .replace("Mbr", "Member")
      .replace("Fm", "Formation")
      .replace("Gp", "Group")
  }
}

export default UnitNamesColumn
