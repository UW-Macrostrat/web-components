import h from "@macrostrat/hyper"
import { useAPIResult } from "@macrostrat/ui-components"
import { FeatureLayer } from "@macrostrat/map-components"

const defaultStyle = {
  fill: "rgb(239, 180, 249)",
  stroke: "magenta",
}

const MeasurementsLayer = props => {
  const { style = defaultStyle, ...params } = props
  const res = useAPIResult("/measurements", {
    ...params,
    format: "geojson",
    response: "light",
  })
  if (res == null) return null

  return h(FeatureLayer, {
    useCanvas: false,
    style,
    features: res.features.filter(d => d.properties.unit_id != null),
  })
}

export { MeasurementsLayer }
