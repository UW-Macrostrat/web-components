import h from "@macrostrat/hyper"
import {
  LithologyColumn,
  PatternDefsProvider,
  ColumnContext,
} from "@macrostrat/column-components"
import { UnitNamesColumn } from "./names"
import { useContext } from "react"
import { resolveID, scalePattern } from "./resolvers"
import { Unit } from "./boxes"
export interface ICompositeUnitProps {
  width: number
  columnWidth: number
  gutterWidth?: number
  labelOffset?: number
}

function CompositeBoxes(props) {
  const { divisions } = useContext(ColumnContext)

  return h(
    PatternDefsProvider,
    { resolveID, scalePattern },
    h(
      "g.divisions",
      divisions.map(div => {
        return h(Unit, {
          division: div,
        })
      })
    )
  )
}

function CompositeUnitsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const { columnWidth, width = 100, gutterWidth = 10, labelOffset = 30 } = props

  return h([
    h(LithologyColumn, { width: columnWidth }, [h(CompositeBoxes)]),
    h(UnitNamesColumn, {
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
