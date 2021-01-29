import { format } from "d3-format"
import { useContext } from "react"
import h from "@macrostrat/hyper"
import classNames from "classnames"
import { AxisBottom } from "@vx/axis"
import { schemeCategory10 } from "d3-scale-chromatic"
import { useMeasurementData } from "./data-provider"

import {
  IsotopesDataArea,
  useDataLocator,
  IsotopeDataLine,
  IsotopeDataPoint,
} from "./data-area"

import {
  CrossAxisLayoutProvider,
  ColumnLayoutContext,
  ColumnContext,
} from "@macrostrat/column-components"
import T from "prop-types"

const fmt = format(".1f")

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

const IsotopeText = function({ datum, text, ...rest }) {
  const { pointLocator } = useDataLocator()
  const [x, y] = pointLocator(datum)
  return h(
    "text",
    {
      x,
      y,
      ...rest,
    },
    text
  )
}

IsotopeText.propTypes = {
  datum: T.object.isRequired,
}

function ColumnScale(props) {
  const { system, ...rest } = props
  const { xScale, pixelHeight, width } = useContext(ColumnLayoutContext)
  const label = system === "delta13c" ? "δ¹³C" : "δ¹⁸O"

  let { tickValues } = rest
  if (tickValues == null) {
    tickValues = xScale.ticks()
  }

  return h("g.scale.isotope-scale-axis", [
    h(
      "g.scale-lines",
      tickValues.map(value => {
        const strokeDasharray = value == 0 ? null : "2 6"
        return h(ScaleLine, { value, stroke: "#ddd", strokeDasharray })
      })
    ),
    h("rect.underlay", {
      x: 0,
      y: pixelHeight,
      width,
      height: 30,
    }),
    h(AxisBottom, {
      scale: xScale,
      rangePadding: -4,
      tickLength: 3,
      ...rest,
      top: pixelHeight,
      tickLabelProps(tickValue, i) {
        // Compensate for negative sign
        let dx
        if (tickValue < 0) {
          dx = -2
        }
        return {
          dy: "-1px",
          dx,
          fontSize: 10,
          textAnchor: "middle",
          fill: "#aaa",
        }
      },
      labelOffset: 0,
      label,
    }),
  ])
}

const ScaleLine = function(props) {
  let { value, className, labelBottom, labelOffset, ...rest } = props
  if (labelBottom == null) {
    labelBottom = false
  }
  if (labelOffset == null) {
    labelOffset = 12
  }
  const { xScale, pixelHeight } = useContext(ColumnLayoutContext)
  const x = xScale(value)
  const transform = `translate(${x})`
  className = classNames(className, { zero: value === 0 })
  return h("g.tick", { transform, className, key: value }, [
    h("line", { x0: 0, x1: 0, y0: 0, y1: pixelHeight, ...rest }),
    h.if(labelBottom)("text", { y: pixelHeight + labelOffset }, `${value}`),
  ])
}

ScaleLine.propTypes = {
  value: T.number.isRequired,
  labelBottom: T.bool,
}

function IsotopesColumnInner(props) {
  let system, transform
  const { isotopes } = props

  const { divisions } = useContext(ColumnContext)
  const { xScale, scale } = useContext(ColumnLayoutContext) ?? {}
  const measures = useMeasurementData() ?? []

  let refMeasures = referenceMeasuresToColumn(divisions, measures)
  //refMeasures = refMeasures.filter(d => d.)

  console.log(refMeasures)

  const stroke = "dodgerblue"

  return h("g.isotopes-column", { transform }, [
    h(ColumnScale, { system, tickValues: [-10, -5, 0] }),
    h(
      IsotopesDataArea,
      {
        system,
        getHeight(d) {
          return d.orig_height
        },
      },
      [
        h(
          "g.data-points",
          isotopes.map(d => {
            return h(IsotopeDataPoint, {
              datum: d,
              stroke,
              strokeWidth: 4,
            })
          })
        ),
        h.if(props.showLines)(IsotopeDataLine, {
          values: isotopes,
          stroke,
        }),
      ]
    ),
  ])
}

IsotopesColumnInner.propTypes = {
  section: T.string.isRequired,
  isotopes: T.arrayOf(T.object).isRequired,
}

IsotopesColumnInner.defaultProps = {
  visible: false,
  label: "δ¹³C",
  system: "delta13c",
  offsetTop: null,
  colorScheme: schemeCategory10,
  correctIsotopeRatios: false,
  padding: {
    left: 10,
    top: 10,
    right: 10,
    bottom: 30,
  },
}

const IsotopesColumn = function(props) {
  const { width, domain, section, ...rest } = props

  const vals = []

  return h(
    CrossAxisLayoutProvider,
    { width, domain },
    h(IsotopesColumnInner, {
      isotopes: vals,
      section,
      ...rest,
    })
  )
}

IsotopesColumn.defaultProps = {
  domain: [-14, 6],
  width: 120,
  nTicks: 6,
}

export { IsotopesColumn }
