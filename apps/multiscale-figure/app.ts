import h, { C, compose } from "@macrostrat/hyper"
import { APIProvider, useAPIResult } from "@macrostrat/ui-components"
import { GeologicPatternProvider } from "@macrostrat/column-components"
import Column from "../carbon-isotopes/column"
import { ColumnMapNavigator, MeasurementsLayer } from "common/column-map"
import { MeasurementDataProvider } from "../carbon-isotopes/data-provider"
import { MacrostratMeasurementProvider } from "./data-provider"
import { useColumnNav } from "common/macrostrat-columns"
import { ColumnMapNavigator } from "common/column-map"
import Column2 from "../enriched-timeline/column"
import patterns from "url:../../geologic-patterns/*.png"

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name)
}

const defaultArgs = {
  col_id: 2163,
  project_id: 10,
  status_code: "in process",
}

const ColumnView = props => {
  const { params } = props
  const data = useAPIResult("/units", {
    all: true,
    ...params,
    response: "long",
  })
  if (data == null) return null
  return h(Column2, { data })
}

const ColumnManager = () => {
  const [columnArgs, setCurrentColumn] = useColumnNav(defaultArgs)

  const { col_id, ...projectParams } = columnArgs

  const colParams = { ...columnArgs, format: "geojson" }
  const res = useAPIResult("/columns", colParams, [columnArgs])
  const columnFeature = res?.features[0]

  const params1 = { col_id: 1481 }
  return h("div.column-ui", [
    h("div.column-left", [
      h(MacrostratMeasurementProvider, params1, h(Column, { params: params1 })),
    ]),
    h("div.column-view", [
      h(ColumnTitle, { data: columnFeature?.properties }),
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
