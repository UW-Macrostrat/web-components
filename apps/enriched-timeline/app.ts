import { useState, useEffect } from "react"
import h from "@macrostrat/hyper"
import {
  APIProvider,
  APIResultView,
  useAPIResult,
  getQueryString,
  setQueryString,
} from "@macrostrat/ui-components"
import { GeologicPatternProvider } from "@macrostrat/column-components"
import { ColumnMapNavigator } from "common/column-map"
import Column, { IUnit } from "./column"
import patterns from "../../geologic-patterns/*.png"

const renderResults = (data: Array<IUnit>) => {
  return h(Column, { data })
}

const ColumnView = props => {
  const { params } = props
  // 495
  return h(
    APIResultView,
    {
      route: "/units",
      params: { all: true, ...params, response: "long" },
    },
    renderResults
  )
}

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name)
}

function useColumnNav(defaultArgs = { col_id: 495 }) {
  const initArgs = getQueryString() ?? defaultArgs
  const [columnArgs, setColumnArgs] = useState(initArgs)

  useEffect(() => setQueryString(columnArgs))

  const { col_id, ...projectParams } = columnArgs

  const setCurrentColumn = obj => {
    let args = obj
    if ("properties" in obj) {
      args = { col_id: obj.properties.col_id, ...projectParams }
    }
    // Set query string
    setQueryString(args)
    setColumnArgs(args)
  }

  return [columnArgs, setCurrentColumn]
}

const ColumnManager = () => {
  const defaultArgs = { col_id: 495 }
  const [currentColumn, setCurrentColumn] = useColumnNav(defaultArgs)
  const { col_id, ...projectParams } = currentColumn

  const colParams = { ...currentColumn, format: "geojson" }
  const res = useAPIResult("/columns", colParams, [currentColumn])
  const columnFeature = res?.features[0]

  // 495
  return h("div.column-ui", [
    h("div.column-view", [
      h(ColumnTitle, { data: columnFeature?.properties }),
      h(ColumnView, { params: currentColumn }),
    ]),
    h("div.map-column", [
      h(ColumnMapNavigator, {
        currentColumn: columnFeature,
        setCurrentColumn,
        margin: 0,
        ...projectParams,
      }),
    ]),
  ])
}

const resolvePattern = id => patterns[id]

const App = () => {
  return h(
    GeologicPatternProvider,
    { resolvePattern },
    h(
      APIProvider,
      {
        baseURL: "https://dev.macrostrat.org/api/v2",
        unwrapResponse: res => res.success.data,
      },
      h(ColumnManager)
    )
  )
}

export default App
