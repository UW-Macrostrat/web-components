import h, { C, compose } from "@macrostrat/hyper"
import { APIProvider, useAPIResult } from "@macrostrat/ui-components"
import { GeologicPatternProvider } from "@macrostrat/column-components"
import { Section, IColumnProps } from "../carbon-isotopes/column"
import { MeasurementDataProvider } from "../carbon-isotopes/data-provider"
import { MacrostratMeasurementProvider } from "./data-providers"
import { useColumnNav } from "common/macrostrat-columns"
import patterns from "url:../../geologic-patterns/*.png"

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name)
}

const columnArgs = {
  col_id: 2163,
  project_id: 10,
  status_code: "in process",
}

function Column(props: IColumnProps) {
  const { params } = props
  const data: IUnit[] = useAPIResult("/units", {
    all: true,
    ...params,
    response: "long",
  })
  if (data == null) return null

  return h("div.column", [
    h("div.age-axis-label", "Age (Ma)"),
    h(Section, {
      range: [650, 540],
      pixelScale: 8,
      data,
      isOldestColumn: true,
    }),
  ])
}

const ColumnManager = () => {
  const { col_id, ...projectParams } = columnArgs

  const params1 = { col_id: 1481 }
  return h("div.column-ui", [
    h("div.column-left", [
      h(
        MacrostratMeasurementProvider,
        { target: params1, source: { col_id } },
        h(Column, { params: params1 })
      ),
    ]),
    h("div.column-view", [
      h(MeasurementDataProvider, columnArgs, [
        h(Column, { params: columnArgs }),
      ]),
    ]),
  ])
}

const resolvePattern = id => patterns[id]

const App = compose(
  C(GeologicPatternProvider, { resolvePattern }),
  C(APIProvider, {
    baseURL: "https://dev.macrostrat.org/api/v2",
    unwrapResponse: res => res.success.data,
  }),
  ColumnManager
)

export default App
