/// https://paleobiodb.org/data1.2/colls/summary.json?show=time&min_ma=10&max_ma=12&level=3

import { useMemo } from "react";
import { useAPIResult } from "@macrostrat/ui-components";
import { usePlatePolygons } from "@macrostrat/corelle";
import { FeatureLayer } from "@macrostrat/map-components";
import { clusterPoints } from "./sgp";
import h from "@macrostrat/hyper";

function useMacrostratFeatures() {
  /** Get features and assign to plates */
  const res = useAPIResult<{ records: any[] }>(
    "https://dev.macrostrat.org/api/v2/measurements",
    {
      format: "geojson",
      response: "light",
      interval_name: "Ordovician"
    }
  );

  return res?.success?.data;
}

const defaultStyle = {
  fill: "rgb(239, 180, 249)",
  stroke: "magenta"
};

const MeasurementsLayer = props => {
  const { style = defaultStyle, ...params } = props;
  const res = useMacrostratFeatures();
  if (res == null) return null;

  const features = clusterPoints(res.features);

  return h(FeatureLayer, {
    useCanvas: false,
    style,
    features
  });
};

export { MeasurementsLayer };
