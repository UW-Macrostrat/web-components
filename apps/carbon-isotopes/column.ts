import h from "@macrostrat/hyper"
import { group } from "d3-array"
import { useAPIResult } from "@macrostrat/ui-components"
import {
  ColumnProvider,
  ColumnSVG,
  ColumnAxis,
  ColumnContext,
} from "@macrostrat/column-components"
import { CompositeUnitsColumn } from "common/units"
import { IUnit } from "common/units/types"
import { useContext } from "react"
import { IsotopesColumn } from "./isotopes-column"

interface IColumnProps {
  data: IUnit[]
  pixelScale?: number
  isOldestColumn: boolean
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
  const { data, isOldestColumn = true } = props
  let { pixelScale } = props

  const notesOffset = 100

  const range = [data[data.length - 1].b_age, data[0].t_age]

  if (!pixelScale) {
    // Make up a pixel scale
    const dAge = range[0] - range[1]
    const targetHeight = 50 * data.length
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
          width: 650,
          padding: 20,
          paddingTop: 5,
          paddingBottom: 25,
        },
        [
          h(AgeAxis),
          h(CompositeUnitsColumn, {
            width: 400,
            columnWidth: 90,
          }),
          h(IsotopesColumn, {
            parameter: "D13C",
            label: "δ¹³C",
            width: 100,
            nTicks: 4,
            showAxis: isOldestColumn,
          }),
          h(IsotopesColumn, {
            parameter: "D18O",
            label: "δ¹⁸O",
            color: "red",
            domain: [-40, 0],
            width: 100,
            nTicks: 4,
            showAxis: isOldestColumn,
          }),
        ]
      ),
    ]
  )
}

function Column(props: IColumnProps) {
  const { params } = props
  const data: IUnit[] = useAPIResult("/units", {
    all: true,
    ...params,
    response: "long",
  })
  if (data == null) return null

  let sectionGroups = Array.from(group(data, d => d.section_id))

  sectionGroups.sort((a, b) => a.t_age - b.t_age)

  return h("div.column", [
    h("div.age-axis-label", "Age (Ma)"),
    h(
      "div.main-column",
      sectionGroups.map(([id, values], i) => {
        return h(`div.section-${id}`, [
          h(Section, {
            data: values,
            isOldestColumn: i == sectionGroups.length - 1,
          }),
        ])
      })
    ),
  ])
}

export default Column
