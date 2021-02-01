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

type SizeAwareLabelProps = React.HTMLProps<"div"> & {
  label: React.ReactNode
  isShown?: boolean
  onVisibilityChanged?(fits: boolean): void
}

function SizeAwareLabel(props: SizeAwareLabelProps) {
  /** A label that only renders if it fits within its container div.
   * This helps build unit and interval labels that do sensible things
   * when.
   *
   * You can use the onUpdate and isShown props to make this a "controlled"
   * component, or you can use the internally managed state. `onUpdate` can
   * be used by itself when you need to report back whether the label was
   * rendered or not (e.g., so you can render it in another location).
   */
  const { label, isShown, onVisibilityChanged, ...rest } = props
  const containerRef = useRef<HTMLElement>()
  const labelRef = useRef<HTMLElement>()
  const [fits, setFits] = useState<boolean | null>(null)
  useEffect(() => {
    const containerSz = refSize(containerRef)
    const labelSz = refSize(labelRef)
    const doesFit =
      labelSz.width <= containerSz.width && labelSz.height <= containerSz.height
    setFits(doesFit)
  }, [containerRef, labelRef])

  // Report whether label fits upwards, if needed
  useEffect(() => {
    if (fits == null) return
    onVisibilityChanged?.(fits)
  }, [fits])

  const shouldShow = isShown ?? fits ?? true

  return h(
    "div.unit-overlay",
    { ...rest, ref: containerRef },
    h(
      "span.unit-label",
      { ref: labelRef, style: { visibility: shouldShow ? null : "hidden" } },
      label
    )
  )
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
