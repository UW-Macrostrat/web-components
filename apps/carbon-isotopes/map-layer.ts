import h from "@macrostrat/hyper"
import { useAPIResult } from "@macrostrat/ui-components"
import { FeatureLayer } from "@macrostrat/map-components"

const MeasurementsLayer = props => {
  const res = useAPIResult("/measurements", {
    format: "geojson",
    measurement: "D13C",
    response: "light",
    project_id: 10,
    status_code: "in process",
  })
  if (res == null) return null

  return h(FeatureLayer, {
    useCanvas: false,
    style: {
      fill: "rgb(239, 180, 249)",
      stroke: "magenta",
    },
    features: res.features.filter(d => d.properties.unit_id != null),
  })
}

export { MeasurementsLayer }
