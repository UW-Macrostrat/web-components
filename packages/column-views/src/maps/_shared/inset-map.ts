import { useMemo } from "react";
import { MapView, getBasicMapStyle } from "@macrostrat/map-interface";
import h from "@macrostrat/hyper";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";
import { useInDarkMode } from "@macrostrat/ui-components";

export function InsetMap({
  controls,
  className,
  children,
  style,
  mapStyle,
  accessToken,
  ...rest
}: any) {
  const inDarkMode = useInDarkMode();
  const _style = useMemo(() => {
    return mapStyle ?? getBasicMapStyle({ inDarkMode });
  }, [mapStyle, inDarkMode]);

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
