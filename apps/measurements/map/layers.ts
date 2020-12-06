import { useAPIResult } from '@macrostrat/ui-components'
import h from '@macrostrat/hyper'
import { FeatureLayer } from '@macrostrat/map-components'
import { feature } from 'topojson-client'

function processTopoJSON(res) {
  try {
    const { data } = res.success
    return feature(data, data.objects.output)
  } catch (err) {
    console.error(err)
    return []
  }
}

const MeasurementsLayer = props => {
  const geometry = useAPIResult(
    '/measurements',
    {
      format: 'topojson',
      measure_phase: 'zircon',
      measurement: '207Pb-206Pb',
      response: 'light',
    },
    processTopoJSON
  )
  if (geometry == null) return null

  return h(FeatureLayer, {
    useCanvas: false,
    style: {
      fill: 'rgb(239, 180, 249)',
      stroke: 'magenta',
    },
    geometry,
  })
}

export { MeasurementsLayer }
