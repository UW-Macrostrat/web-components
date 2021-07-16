import h from "@macrostrat/hyper"
import { useContext, createContext, useEffect, useState } from "react"
import {
  useMeasurementData,
  MeasurementDataContext,
} from "../carbon-isotopes/data-provider"
import { useAPIResult, useAPIActions } from "@macrostrat/ui-components"

const MeasurementDataContext = createContext(null)

async function buildMacrostratMeasurements(sourceParams: any, targetCol: any) {
  const { get } = useAPIActions()
  const res = await get("/measurements", {
    ...sourceParams,
    show_values: true,
    response: "long",
  })
  console.log(res)
  return res
}

function MacrostratColumnMeasurementProvider(props) {
  const { children, ...params } = props
  const data = useMeasurementData()
  useEffect(() => {}, [])

  const res = useAPIResult("/measurements", {
    ...params,
    show_values: true,
    response: "long",
  })
  return h(MeasurementDataContext.Provider, { value: res, children })
}

export { MacrostratColumnMeasurementProvider, useMeasurementData }
