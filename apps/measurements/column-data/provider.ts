import { useContext, createContext, useMemo } from 'react'
import { useDetritalMeasurements, MeasurementInfo } from '../detrital/provider'
import { useAPIResult } from '@macrostrat/ui-components'

import h from '@macrostrat/hyper'

function useColumnFootprint(columnArgs) {
  const colParams = { ...columnArgs, format: 'geojson' }
  const res = useAPIResult('/columns', colParams, [columnArgs])
  return res?.features[0]
}

function useColumnUnits(columnArgs) {
  return useAPIResult(
    '/units',
    { all: true, ...columnArgs, response: 'long' },
    [columnArgs]
  )
}

interface ColumnCtx {
  params: {
    col_id: number
    project_id?: number
  }
  dz: MeasurementInfo[]
  footprint: any
  units: any[]
}

const ColumnDataContext = createContext<ColumnCtx | null>(null)

function ColumnDataProvider(props: React.PropsWithChildren<ColumnCtx>) {
  const { children, params } = props
  const measurements = useDetritalMeasurements(params)
  const footprint = useColumnFootprint(params)
  const units = useColumnUnits(params)
  console.log('Rendering provider')
  const value = useMemo(() => {
    return { measurements, footprint, units, params }
  }, [measurements, footprint, units, params])
  return h(ColumnDataContext.Provider, { value, children })
}

const useColumnData = () => useContext(ColumnDataContext)

export { ColumnDataProvider, ColumnDataContext, useColumnData }
