import h from "@macrostrat/hyper"
import { useContext, ReactNode } from "react"
import {
  ColumnContext,
  ColumnLayoutContext,
  PatternDefsProvider,
  useGeologicPattern,
} from "@macrostrat/column-components"
import { IUnit } from "./types"
import { resolveID, scalePattern } from "./resolvers"

interface UnitProps {
  division: IUnit
  resolveID(IUnit): string
  UUID: string
  children?: ReactNode
}

const Unit = (props: UnitProps) => {
  const { division: d, children } = props
  const { scale } = useContext(ColumnContext)
  const { width } = useContext(ColumnLayoutContext)
  const patternID = resolveID(d)
  const fill = useGeologicPattern(patternID, "#aaa")

  const y = scale(d.t_age)
  const height = scale(d.b_age) - y

  return h("rect.unit", {
    x: 0,
    y,
    width,
    height,
    fill,
    onMouseOver() {
      console.log(d)
    },
    children,
  })
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

export { Unit, UnitBoxes, UnitProps }
