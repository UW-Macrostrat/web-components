import { useEffect, useState } from "react"
import h, { C, compose } from "@macrostrat/hyper"
import {
  APIProvider,
  useAPIResult,
  getQueryString,
  setQueryString,
} from "@macrostrat/ui-components"
import { GeologicPatternProvider } from "@macrostrat/column-components"
import Column from "./column"
import { ColumnMapNavigator, MeasurementsLayer } from "common/column-map"
import { MeasurementDataProvider } from "./data-provider"
import patterns from "url:../../geologic-patterns/*.png"

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name)
}

const ColumnManager = () => {
  const defaultArgs = {
    col_id: 2192,
    project_id: 10,
    status_code: "in process",
  }
  const initArgs = getQueryString() ?? defaultArgs
  const [columnArgs, setColumnArgs] = useState(initArgs)

  useEffect(() => setQueryString(columnArgs))

  const { col_id, ...projectParams } = columnArgs

  const colParams = { ...columnArgs, format: "geojson" }
  const res = useAPIResult("/columns", colParams, [columnArgs])
  const columnFeature = res?.features[0]

  const setCurrentColumn = obj => {
    let args = obj
    if ("properties" in obj) {
      args = { col_id: obj.properties.col_id, ...projectParams }
    }
    // Set query string
    setQueryString(args)
    setColumnArgs(args)
  }

  return h(MeasurementDataProvider, columnArgs, [
    h("div.column-ui", [
      h("div.column-view", [
        h(ColumnTitle, { data: columnFeature?.properties }),
        h(Column, { params: columnArgs }),
      ]),
      h("div.map-column", [
        h(
          ColumnMapNavigator,
          {
            currentColumn: columnFeature,
            setCurrentColumn,
            margin: 0,
            ...projectParams,
          },
          h(MeasurementsLayer, {
            ...projectParams,
            style: {
              fill: "dodgerblue",
              stroke: "blue",
            },
          })
        ),
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
