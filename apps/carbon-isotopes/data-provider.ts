import h from "@macrostrat/hyper"
import { useContext, createContext } from "react"
import { useAPIResult } from "@macrostrat/ui-components"

const MeasurementDataContext = createContext(null)

function MeasurementDataProvider(props) {
  const { children, ...params } = props
  const res = useAPIResult("/measurements", {
    ...params,
    show_values: true,
    response: "long",
  })
  return h(MeasurementDataContext.Provider, { value: res, children })
}

const useMeasurementData = () => useContext(MeasurementDataContext)

export { MeasurementDataProvider, useMeasurementData, MeasurementDataContext }
