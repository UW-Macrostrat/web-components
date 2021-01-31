import h from "@macrostrat/hyper"
import { useContext, ReactNode, useRef, useEffect, useState } from "react"
import {
  ColumnContext,
  ColumnLayoutContext,
  PatternDefsProvider,
  useGeologicPattern,
  ForeignObject,
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

interface ElementSize {
  width: number
  height: number
}

function refSize(ref: React.RefObject<HTMLElement>): ElementSize {
  const { width, height } = ref.current?.getBoundingClientRect()
  return { width, height }
}

function SizeAwareLabel(props) {
  /** A label that only renders if it fits within its container div */
  const { label, ...rest } = props
  const containerRef = useRef<HTMLElement>()
  const labelRef = useRef<HTMLElement>()
  const [fits, setFits] = useState<boolean | null>(null)
  useEffect(() => {
    const containerSz = refSize(containerRef)
    const labelSz = refSize(labelRef)
    setFits(
      labelSz.width <= containerSz.width && labelSz.height <= containerSz.height
    )
  }, [containerRef, labelRef])

  return h(
    "div.unit-overlay",
    { ...rest, ref: containerRef },
    h.if(fits ?? true)("span.unit-label", { ref: labelRef }, label)
  )
}

function LabeledUnit(props) {
  const { division, label } = props
  const bounds = useUnitRect(division)
  const { x, y, ...size } = bounds
  return h("g.labeled-unit", [
    h(Unit, { division }),
    h(ForeignObject, bounds, h(SizeAwareLabel, { style: size, label })),
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
