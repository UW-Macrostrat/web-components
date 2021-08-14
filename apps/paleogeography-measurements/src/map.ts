import { geoStereographic } from "d3-geo";
import { useRef } from "react";
import { PlateFeatureLayer } from "@macrostrat/corelle";
import { hyperStyled } from "@macrostrat/hyper";
import {
  PBDBCollectionLayer,
  SGPSamplesLayer,
  MacrostratMeasurementsLayer
} from "./point-overlay";
import { Globe } from "@macrostrat/map-components";
import styles from "./main.styl";

const h = hyperStyled(styles);

const baseProjection = geoStereographic().precision(0.5);

const Map = props => {
  /** Map that implements callback to reset internal map state */
  const { width, height } = props;
  const projection = baseProjection;
  const mapRef = useRef<Globe>();

  const resetMap = () => {
    // We have to totally recreate the projection for it to be immutable
    mapRef.current?.resetProjection(baseProjection);
  };

  return h("div.world-map", null, [
    h(
      Globe,
      {
        ref: mapRef,
        keepNorthUp: true,
        projection,
        width,
        height,
        keepNorthUp: false,
        scale: Math.min(width / 1.5, height / 1.5) - 10
      },
      [
        h(PlateFeatureLayer, {
          name: "ne_110m_land",
          useCanvas: false,
          style: {
            fill: "#E9FCEA",
            stroke: "#9dc99f"
          }
        }),
        h(PBDBCollectionLayer),
        h(MacrostratMeasurementsLayer),
        h(SGPSamplesLayer)
      ]
    ),
    h("a.reset-map", { onClick: resetMap }, "Reset projection")
  ]);
};

export { Map };
