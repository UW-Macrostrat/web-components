import { useState, useEffect } from "react";
import h from "@macrostrat/hyper";
import { FeatureLayer } from "./feature";
import axios from "axios";
import { feature } from "topojson-client";

export const LandLayer = ({
  fill = "rgb(233, 252, 234)",
  stroke = "transparent",
  useCanvas = false,
}) => {
  const [geometry, setGeometry] = useState(null);
  useEffect(() => {
    axios.get("https://unpkg.com/world-atlas@1/world/110m.json").then((res) => {
      const { data } = res;
      // Parse topoJSON
      const geom = feature(data, data.objects.land);
      setGeometry(geom);
    });
  }, []);
  return h(FeatureLayer, {
    useCanvas,
    style: {
      fill,
      stroke,
    },
    geometry,
  });
};
