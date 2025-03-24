import { useMemo } from "react";
import { MapView, useBasicMapStyle } from "@macrostrat/map-interface";
import h from "@macrostrat/hyper";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";

export function InsetMap({
  controls,
  className,
  children,
  style,
  mapStyle,
  accessToken,
  ...rest
}: any) {
  const _style = useMemo(() => {
    return mapStyle ?? useBasicMapStyle();
  }, [mapStyle]);

  return h("div.inset-map", { className, style }, [
    h(MapboxMapProvider, [
      controls,
      h(
        MapView,
        {
          style: _style,
          accessToken,
          standalone: true,
          ...rest,
        },
        children
      ),
    ]),
  ]);
}
