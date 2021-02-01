import h from "@macrostrat/hyper"
import { useContext, ReactNode } from "react"
import {
  ColumnContext,
  ColumnLayoutContext,
  PatternDefsProvider,
  useGeologicPattern,
  ForeignObject,
  SizeAwareLabel,
  SizeAwareLabelProps,
} from "@macrostrat/column-components"
import { IUnit } from "./types"
import { resolveID, scalePattern } from "./resolvers"

interface UnitProps {
  division: IUnit
  resolveID(IUnit): string
  UUID: string
  children?: ReactNode
}

function useUnitRect(division: IUnit) {
  const { scale } = useContext(ColumnContext)
  const { width } = useContext(ColumnLayoutContext)
  const y = scale(division.t_age)
  const height = scale(division.b_age) - y
  return { x: 0, y, height, width }
}

const Unit = (props: UnitProps) => {
  const { division: d, children } = props
  const bounds = useUnitRect(d)
  const patternID = resolveID(d)
  const fill = useGeologicPattern(patternID, "#aaa")

  return h("rect.unit", {
    ...bounds,
    fill,
    onMouseOver() {
      console.log(d)
    },
    children,
  })
}

interface LabeledUnitProps extends SizeAwareLabelProps {
  division: IUnit
  onLabelUpdated?(label: string, shown: boolean)
}

function LabeledUnit(props: LabeledUnitProps) {
  const { division, label, onLabelUpdated, ...rest } = props
  const bounds = useUnitRect(division)
  const { x, y, ...size } = bounds
  return h("g.labeled-unit", [
    h(Unit, { division }),
    h(
      ForeignObject,
      bounds,
      h(SizeAwareLabel, {
        style: size,
        label,
        onVisibilityChanged(viz) {
          onLabelUpdated(label, viz)
        },
        ...rest,
      })
    ),
  ])
}

function UnitBoxes(props) {
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

export { Unit, UnitBoxes, UnitProps, LabeledUnit }
