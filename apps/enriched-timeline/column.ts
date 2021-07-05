import h from "@macrostrat/hyper"
import { group } from "d3-array"
import {
  ColumnProvider,
  ColumnSVG,
  LithologyColumn,
  ColumnAxis,
  ColumnContext,
  NotesColumn,
} from "@macrostrat/column-components"
import { CompositeUnitsColumn } from "common/units"
import { IUnit } from "common/units/types"
import { useContext } from "react"
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale"
import "@macrostrat/timescale/dist/timescale.css"

interface IColumnProps {
  data: IUnit[]
  pixelScale?: number
}

const AgeAxis = ({ ticks }) => {
  const { pixelHeight } = useContext(ColumnContext)
  // A tick roughly every 40 pixels
  let v = Math.max(Math.round(pixelHeight / 40), 1)

  return h(ColumnAxis, {
    ticks: v,
    showDomain: false,
  })
}

const Section = (props: IColumnProps) => {
  // Section with "squishy" time scale
  const { data } = props
  let { pixelScale } = props

  const notesOffset = 100

  const range = [data[data.length - 1].b_age, data[0].t_age]
  const dAge = range[0] - range[1]

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = 20 * data.length
    pixelScale = Math.ceil(targetHeight / dAge)
  }

  return h(
    ColumnProvider,
    {
      divisions: data,
      range,
      pixelsPerMeter: pixelScale, // Actually pixels per myr
    },
    [
      h(
        ColumnSVG,
        {
          width: 30,
          padding: 20,
          paddingV: 5,
        },
        [h(AgeAxis)]
      ),
      h(Timescale, {
        orientation: TimescaleOrientation.VERTICAL,
        length: dAge * pixelScale,
        levels: [2, 5],
        absoluteAgeScale: true,
        showAgeAxis: false,
        ageRange: range,
      }),
      h(
        ColumnSVG,
        {
          width: 650,
          padding: 20,
          paddingLeft: 1,
          paddingV: 5,
        },
        [
          h(CompositeUnitsColumn, {
            width: 400,
            columnWidth: 140,
            gutterWidth: 0,
          }),
        ]
      ),
    ]
  )
}

const Column = (props: IColumnProps) => {
  const { data } = props

  let sectionGroups = Array.from(group(data, d => d.section_id))

  sectionGroups.sort((a, b) => a.t_age - b.t_age)

  return h("div.column", [
    h("div.age-axis-label", "Age (Ma)"),
    h(
      "div.main-column",
      sectionGroups.map(([id, values]) => {
        return h(`div.section.section-${id}`, [h(Section, { data: values })])
      })
    ),
  ])
}

export default Column
