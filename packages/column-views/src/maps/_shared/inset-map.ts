import { useCallback, useMemo } from "react";
import { MapView, getBasicMapStyle } from "@macrostrat/map-interface";
import h from "@macrostrat/hyper";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";
import { useInDarkMode } from "@macrostrat/ui-components";
import {
  removeMapLabels,
  removeSourceFromStyle,
} from "@macrostrat/mapbox-utils";

export function InsetMap({
  controls,
  className,
  children,
  style,
  mapStyle,
  accessToken,
  showLabels = false,
  showAdmin = false,
  showRoads = false,
  ...rest
}: any) {
  const inDarkMode = useInDarkMode();
  const _style = useMemo(() => {
    return mapStyle ?? getBasicMapStyle({ inDarkMode });
  }, [mapStyle, inDarkMode]);

  const transformStyle = useCallback(
    (style) => {
      let newStyle = style;
      if (!showLabels) {
        newStyle = removeMapLabels(newStyle);
      }
      if (!showAdmin) {
        newStyle = removeSourceFromStyle(newStyle, null, "admin");
      }
      if (!showRoads) {
        newStyle = removeSourceFromStyle(newStyle, null, "road");
        newStyle = removeSourceFromStyle(newStyle, null, "aeroway");
      }
      return newStyle;
    },
    [mapStyle, showLabels, showRoads, showAdmin]
  );

  return h("div.inset-map", { className, style }, [
    h(MapboxMapProvider, [
      controls,
      h(
        MapView,
        {
          style: _style,
          accessToken,
          standalone: true,
          /* Default map position that centers on the bulk of Macrostrat columns
           */
          mapPosition: {
            camera: {
              lng: -100,
              lat: 38,
              altitude: 5000000,
            },
          },
          transformStyle,
          ...rest,
        },
        children
      ),
    ]),
  ]);
}
