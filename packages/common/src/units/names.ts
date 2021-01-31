import h from "@macrostrat/hyper"
import { useContext } from "react"
import {
  ColumnContext,
  NotesColumn,
  NotesColumnProps,
} from "@macrostrat/column-components"
import { INote } from "@macrostrat/column-components"
import { IUnit } from "./types"
interface UnitNamesProps extends NotesColumnProps {
  left?: number
  transform: string
  nameForDivision?(obj: IUnit): string
}

const NoteComponent = props => {
  const { note } = props
  const text = note.note
  return h("p.col-note-label", text)
}

const noteForDivision = (
  unitNameFn: (a: IUnit) => string
): ((div: IUnit) => INote) => div => {
  return {
    height: div.b_age,
    top_height: div.t_age,
    note: unitNameFn(div),
    id: div.unit_id,
  }
}

const defaultNameFunction = div => {
  return div.unit_name
    .replace("Mbr", "Member")
    .replace("Fm", "Formation")
    .replace("Gp", "Group")
}

const UnitNamesColumn = (props: UnitNamesProps) => {
  const { left, nameForDivision = defaultNameFunction, ...rest } = props
  const { divisions } = useContext(ColumnContext)

  const notes: INote[] = divisions.map(noteForDivision(nameForDivision))

  return h(NotesColumn, {
    transform: `translate(${left || 0})`,
    editable: false,
    noteComponent: NoteComponent,
    notes,
    forceOptions: {
      nodeSpacing: 1,
    },
    ...rest,
  })
}

export { UnitNamesColumn, defaultNameFunction }
