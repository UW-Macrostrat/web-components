import h from "@macrostrat/hyper"
import { useContext, createContext, useEffect, useState } from "react"
import {
  useMeasurementData,
  MeasurementDataContext,
} from "../carbon-isotopes/data-provider"
import res from "./data/macrostrat/measurements.json"

function MacrostratMeasurementProvider(props) {
  const { children, ...params } = props
  return h(MeasurementDataContext.Provider, {
    value: res.success.data,
    children,
  })
}

export { MacrostratMeasurementProvider, useMeasurementData }
