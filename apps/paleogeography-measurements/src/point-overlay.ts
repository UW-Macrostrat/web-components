/// https://paleobiodb.org/data1.2/colls/summary.json?show=time&min_ma=10&max_ma=12&level=3
import { useRotations, usePathGenerator } from "@macrostrat/corelle";
import { FeatureLayer } from "@macrostrat/map-components";
import { useSGPData } from "./features/sgp";
import { scalePow } from "d3-scale";
import { usePBDBFeatures } from "./features";
import h from "@macrostrat/hyper";

const radiusScale = scalePow([0, 30], [1, 10])
  .exponent(0.5)
  .clamp(true);
const opacityScale = scalePow([0, 30], [0.8, 0.2])
  .exponent(0.5)
  .clamp(true);

function PBDBPoint({ feature }) {
  /** Render a single PBDB point */
  const proj = usePathGenerator(feature.plate_id);
  const { time } = useRotations();
  if (proj == null) return null;
  if (time < feature.young_lim || time > feature.old_lim) return null;

  const { noc, nco, lng, lat } = feature;
  const radius = radiusScale(nco + noc);
  const pt = proj.pointRadius(radius)({
    coordinates: [lng, lat],
    type: "Point"
  });

  if (pt == null) return null;
  return h("path.pbdb-collection", {
    opacity: opacityScale(nco + noc),
    d: pt
  });
}

export function PBDBCollectionLayer() {
  const { time } = useRotations();
  const features = usePBDBFeatures(time);

  return h(
    "g.pbdb-collections",
    {},
    features.map((d, i) => {
      return h(PBDBPoint, { feature: d });
    })
  );
}

const defaultStyle = {
  fill: "transparent",
  stroke: "purple"
};

export function SGPSamplesLayer() {
  const { time } = useRotations();
  const features = useSGPData(time);
  console.log(features);
  if (features == null) return null;

  return h(FeatureLayer, {
    useCanvas: false,
    style: defaultStyle,
    features
  });
}
