import { DetritalSpectrumPlot, DetritalSeries } from 'common/dz-spectrum'
import h from '@macrostrat/hyper'
import { useAPIResult } from '@macrostrat/ui-components'
import { useColumnData } from '../column-data/provider'
import { useDetritalMeasurements, MeasurementInfo } from './provider'

interface DetritalItemProps {
  data: MeasurementInfo[]
}

function DetritalGroup(props: DetritalItemProps) {
  const { data } = props
  const { geo_unit } = data[0]

  return h('div.detrital-group', [
    h('h5.geo-unit', geo_unit),
    h(
      DetritalSpectrumPlot,
      data.map(d => {
        return h(DetritalSeries, {
          bandwidth: 30,
          data: d.measure_value,
        })
      })
    ),
  ])
}

function DetritalColumn() {
  const { measurements: data, units } = useColumnData()

  if (data == null || units == null) return null

  let dzUnitData = Array.from(data.values())
  dzUnitData.sort((a, b) => {
    const v1 = units.findIndex(d => d.unit_id == a[0].unit_id)
    const v2 = units.findIndex(d => d.unit_id == b[0].unit_id)
    return v1 > v2
  })

  // group by units
  return h(
    'div.detrital-column',
    null,
    dzUnitData.map(d => {
      return h(DetritalGroup, { data: d })
    })
  )
}

export { DetritalColumn, DetritalGroup, useDetritalMeasurements }
