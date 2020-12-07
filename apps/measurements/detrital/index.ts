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
          data: d.measure_value,
        })
      })
    ),
  ])
}

function DetritalColumn() {
  const { measurements: data } = useColumnData()

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
