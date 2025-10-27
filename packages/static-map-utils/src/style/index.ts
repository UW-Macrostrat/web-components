import { useEffect, useMemo, useState } from "react";
import { getMapboxStyle } from "@macrostrat/mapbox-utils";
import { StyleSpecification } from "mapbox-gl";
import { prepareStyleForMaplibre, optimizeTerrain } from "./helpers";

export { prepareStyleForMaplibre, optimizeTerrain };

export function useInsetMapStyle(mapboxToken) {
  /** Inset map style for basic context map use */
  const baseStyleURL = "mapbox://styles/jczaplewski/ckxcu9zmu4aln14mfg4monlv3";

  const [baseStyle, setBaseStyle] = useState<StyleSpecification | null>(null);
  useEffect(() => {
    if (baseStyleURL == null) return;
    getMapboxStyle(baseStyleURL, {
      access_token: mapboxToken,
    }).then((baseStyle) => {
      setBaseStyle(baseStyle);
    });
  }, [baseStyleURL]);

  return useMemo(() => {
    if (baseStyle == null) {
      return null;
    }

    // remove all layers of type "fill" to get rid of landcover
    baseStyle.layers = baseStyle.layers.filter(
      (layer) =>
        layer.type != "fill" || layer.id === "water" || layer.id == "snow",
    );

    for (const layer of baseStyle.layers) {
      if (layer.type == "background") {
        layer.paint = {
          ...layer.paint,
          "background-color": "#ffffff",
        };
      }
    }

    // Modernize the terrain source
    const style = prepareStyleForMaplibre(
      optimizeTerrain(baseStyle, "mapbox://mapbox.mapbox-terrain-dem-v1", [
        "#ffffff",
        "#aaaaaa",
      ]),
    );
    return style;
  }, [baseStyle]);
}
