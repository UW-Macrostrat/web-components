import h from "@macrostrat/hyper"
import { APIProvider, useAPIResult } from "@macrostrat/ui-components"
import { GeologicPatternProvider } from "@macrostrat/column-components"
import { ColumnMapNavigator } from "common/column-map"
import patterns from "../../geologic-patterns/*.png"
import { useColumnNav } from "common/macrostrat-columns"

const ColumnManager = () => {
  const defaultArgs = { col_id: 4371, project_id: 3 }
  const [currentColumn, setCurrentColumn] = useColumnNav(defaultArgs)
  const { col_id, ...projectParams } = currentColumn

  const colParams = { ...currentColumn, format: "geojson" }
  const res = useAPIResult("/defs/columns", colParams, [currentColumn])
  const columnFeature = res?.features[0]

  // 495
  return h("div.column-ui", [
    h("h1", "Ocean-drilling sites"),
    h(ColumnMapNavigator, {
      currentColumn: columnFeature,
      setCurrentColumn,
      margin: 0,
      apiRoute: "/defs/columns",
      ...projectParams,
    }),
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
