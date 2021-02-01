import h from "@macrostrat/hyper"
import {
  LithologyColumn,
  PatternDefsProvider,
  NotesColumn,
  ColumnContext,
  INote,
} from "@macrostrat/column-components"
import { defaultNameFunction, noteForDivision, NoteComponent } from "./names"
import { createContext, useContext, useState, useRef, useCallback } from "react"
import { resolveID, scalePattern } from "./resolvers"
import { LabeledUnit } from "./boxes"
import { IUnit } from "./types"

interface LabelTracker {
  [key: number]: boolean
}

const LabelTrackerContext = createContext(null)
const UnlabeledDivisionsContext = createContext(null)

function LabelTrackerProvider(props) {
  const { children } = props
  const { divisions } = useContext(ColumnContext)
  const [unlabeledDivisions, setUnlabeledDivisions] = useState<IUnit[] | null>(
    null
  )
  const labelTrackerRef = useRef<LabelTracker>({})
  const trackLabelVisibility = useCallback(
    (div, visible) => {
      console.log(div, visible)
      labelTrackerRef.current[div.unit_id] = visible
      if (Object.keys(labelTrackerRef.current).length == divisions.length) {
        setUnlabeledDivisions(
          divisions.filter(d => labelTrackerRef.current[d.unit_id] == false)
        )
      }
    },
    [labelTrackerRef, divisions]
  )

  const value = trackLabelVisibility
  return h(
    LabelTrackerContext.Provider,
    { value },
    h(
      UnlabeledDivisionsContext.Provider,
      { value: unlabeledDivisions },
      children
    )
  )
}

export interface ICompositeUnitProps {
  width: number
  columnWidth: number
  gutterWidth?: number
  labelOffset?: number
}

function CompositeBoxes(props: {
  divisions: IUnit[]
  nameForDivision?(division: IUnit): string
}) {
  const { divisions, nameForDivision = defaultNameFunction } = props
  const trackLabelVisibility = useContext(LabelTrackerContext)

  return h(
    PatternDefsProvider,
    { resolveID, scalePattern },
    h(
      "g.divisions",
      divisions.map(div => {
        return h(LabeledUnit, {
          division: div,
          label: nameForDivision(div),
          //isShown: labelVisibility[div.unit_id] ?? true,
          onLabelUpdated(label, visible) {
            console.log(label, visible)
            trackLabelVisibility(div, visible)
          },
        })
      })
    )
  )
}

function UnitNamesColumn(props) {
  const { left, nameForDivision = defaultNameFunction, ...rest } = props
  const divisions = useContext(UnlabeledDivisionsContext)
  if (divisions == null) return null

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

function CompositeUnitsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const { columnWidth, width = 100, gutterWidth = 10, labelOffset = 30 } = props

  const { divisions } = useContext(ColumnContext)

  return h(LabelTrackerProvider, [
    h(LithologyColumn, { width: columnWidth }, [
      h(CompositeBoxes, {
        divisions,
      }),
    ]),
    h(UnitNamesColumn, {
      nameForDivision: defaultNameFunction,
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth,
    }),
  ])
}

export {
  UnitsColumn,
  UnitNamesColumn,
  SimpleUnitsColumn,
  CompositeUnitsColumn,
  ICompositeUnitProps,
}
