import { DetritalSpectrumPlot, DetritalSeries } from 'common/dz-spectrum'
import { group } from 'd3-array'
import h from '@macrostrat/hyper'
import { useAPIResult } from '@macrostrat/ui-components'

export interface MeasurementInfo {
  measurement_id: number
  measuremeta_id: number
  measurement: string
  measure_units: string
  measure_phase: string
  method: string
  n: number
  ref_id: number
  sample_name: string
  geo_unit: string
  samp_lith: string
  samp_lith_id: number
  samp_desc: string
  samp_age: string
  lat: number
  lng: number
  unit_id: number
  unit_rel_pos?: any
  col_id: number
  strat_name_id: number
  match_basis: string
  ref: string
  measure_value: number[]
  measure_error: number[]
  measure_position: any[]
  measure_n: number[]
  sample_no: string[]
  error_units: string
}

interface DetritalItemProps {
  data: MeasurementInfo[]
}

function DetritalGroup(props: DetritalItemProps) {
  const { data } = props
  const { geo_unit } = data[0]

  return h('div.detrital-group', [
    h('h4.geo-unit', geo_unit),
    h(
      DetritalSpectrumPlot,
      data.map(d => {
        return h(DetritalSeries, {
          data: d.measure_value,
        })
      })
    ),
  ])
}

function useDetritalMeasurements(columnArgs) {
  const params = {
    ...columnArgs,
    measure_phase: 'zircon',
    response: 'long',
    show_values: true,
    // Other isotope systems are organized separately
    measurement: '207Pb-206Pb',
  }
  const res: MeasurementInfo[] = useAPIResult(
    'https://dev.macrostrat.org/api/v2/measurements',
    params,
    Object.values(columnArgs)
  )
  if (res == null) return null
  return group(res, d => d.unit_id)
}

function DetritalColumn(columnArgs) {
  const data = useDetritalMeasurements(columnArgs)

  if (data == null) return null

  // group by units
  return h(
    'div.detrital-column',
    null,
    Array.from(data.values()).map(d => {
      return h(DetritalGroup, { data: d })
    })
  )
}

export { DetritalColumn, DetritalGroup, useDetritalMeasurements }
