/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { line } from "d3-shape"
import { createContext, useContext } from "react"
import h from "@macrostrat/hyper"
import {
  ColumnContext,
  ColumnLayoutContext,
} from "@macrostrat/column-components"
import { useMeasurementData } from "./data-provider"

const inDomain = (scale, num) => {
  const domain = scale.domain()
  return domain[0] < num < domain[1]
}

const valueAtStdev = function(opts) {
  let { system, corrected } = opts
  if (corrected == null) {
    corrected = false
  }
  if (system == null) {
    system = "delta13c"
  }
  if (corrected) {
    system += "_corr"
  }
  return function(d, s = 0) {
    let v = d["avg_" + system]
    if (s !== 0) {
      v += d["std_" + system] * s
    }
    return v
  }
}

const createPointLocator = function(opts) {
  const { xScale, scale, getHeight, ...rest } = opts
  const val = valueAtStdev(rest)
  return function(d, s = 0) {
    const v = val(d, s)
    const height = getHeight(d)
    if (!inDomain(scale, height)) return null
    return [xScale(v), scale(height)]
  }
}

const IsotopesDataContext = createContext()

interface DataAreaProps {
  clipY: boolean
  parameter: string
}

function referenceMeasuresToColumn(units, measures) {
  /** Add a `measure_age` parameter containing absolute ages derived from units. */
  const ids = units.map(d => d.unit_id)
  const colMeasures = measures.filter(d => ids.includes(d.unit_id))

  return colMeasures.map(measure => {
    const unit = units.find(u => u.unit_id == measure.unit_id)

    const unitAgeSpan = unit.b_age - unit.t_age

    const measure_age = measure.measure_position.map(pos => {
      return (pos / 100) * unitAgeSpan + unit.t_age
    })

    return { measure_age, ...measure }
  })
}

const IsotopesDataArea = function(props: DataAreaProps) {
  const { parameter } = props
  const { divisions } = useContext(ColumnContext)
  const { xScale, scale } = useContext(ColumnLayoutContext) ?? {}
  const measures = useMeasurementData() ?? []

  let refMeasures = referenceMeasuresToColumn(divisions, measures)
  //refMeasures = refMeasures.filter(d => d.)

  console.log(refMeasures)

  let { corrected, system, children, getHeight, clipY } = props
  if (getHeight == null) {
    getHeight = function(d) {
      if (d.height == null) {
        console.log(d)
      }
      return d.height
    }
  }

  // Handlers for creating points and lines
  const pointLocator = createPointLocator({
    xScale,
    scale,
    corrected,
    system,
    getHeight,
  })

  let column = "avg_" + system
  if (corrected) {
    column += "_corr"
  }
  const lineLocator = line()
    .x(d => xScale(d[column]))
    .y(d => scale(d.height))

  const value = { pointLocator, lineLocator, corrected, system, clipY }
  return h(IsotopesDataContext.Provider, { value }, h("g.data", null, children))
}

IsotopesDataArea.defaultProps = { clipY: false }

const IsotopeDataPoint = function(props) {
  const { pointLocator } = useContext(IsotopesDataContext)
  const { datum, strokeWidth, ...rest } = props
  //[x1,y1] = pointLocator(datum, -2)
  const loc = pointLocator(datum, 0)
  if (loc == null) return null
  const [x0, y] = loc
  const [x1, y1] = pointLocator(datum, 2)

  let dx = x1 - x0 - strokeWidth / 2
  if (dx < 0) {
    dx = 0
  }

  return h("line", {
    key: datum.analysis_id,
    x1: x0 - dx,
    y1: y,
    x2: x1 + dx,
    y2: y,
    strokeLinecap: "round",
    strokeWidth,
    ...rest,
  })
}

const IsotopeDataLine = function(props) {
  const { values: lineValues, ...rest } = props
  const { lineLocator } = useContext(IsotopesDataContext)
  return h("path", {
    d: lineLocator(lineValues),
    fill: "transparent",
    ...rest,
  })
}

const useDataLocator = () => useContext(IsotopesDataContext)

export { IsotopesDataArea, IsotopeDataPoint, IsotopeDataLine, useDataLocator }
