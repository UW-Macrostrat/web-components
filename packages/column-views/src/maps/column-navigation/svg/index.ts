import { useRef } from "react";
import h from "@macrostrat/hyper";
import { Globe, LandLayer } from "@macrostrat/svg-map-components";
import { geoCentroid } from "d3-geo";
import { useElementSize } from "@macrostrat/ui-components";
import { Columns, CurrentColumn } from "./layers";
import type { LngLatLike } from "mapbox-gl";

export function ResizableMapFrame(props) {
  const { center, children, style, margin, className, allowZoom, ...rest } =
    props;
  let { scale } = props;
  const ref = useRef(null);
  const sz = useElementSize(ref);
  const { width, height } = sz ?? { width: 0, height: 0 };
  if (scale == null) {
    scale = Math.min(width, height) + 2 * margin;
  }

  let zoomScaleExtent = null;

  if (allowZoom) {
    zoomScaleExtent = [
      0.1 * Math.min(width, height),
      2 * Math.max(width, height),
    ];
  }

  return h("div.map-area", { ref, style, className }, [
    h(
      Globe,
      {
        width,
        height,
        margin,
        center,
        allowDrag: true,
        allowZoom,
        keepNorthUp: true,
        zoomScaleExtent,
        ...rest,
        scale,
      },
      [h(LandLayer), children]
    ),
  ]);
}

type ColumnNavigationSVGMapProps = any;
export type { ColumnNavigationSVGMapProps };

export function ColumnNavigationSVGMap(props) {
  const {
    currentColumn,
    setCurrentColumn,
    children,
    style,
    margin = 10,
    scale,
    className,
    showInProcessColumns = false,
    showDebugLayers = false,
    center,
    ...rest
  } = props;

  let _center: LngLatLike | null = center ?? [-100, 38];
  // Override center if currentColumn is set
  if (currentColumn != null) {
    _center = geoCentroid(currentColumn);
  }

  return h(
    ResizableMapFrame,
    { center: _center, style, margin, scale, className },
    [
      children,
      h(Columns, {
        onChange: setCurrentColumn,
        col_id: currentColumn?.properties.col_id,
        showDebugLayers,
        ...rest,
      }),
      h.if(showInProcessColumns)(Columns, {
        onChange: setCurrentColumn,
        col_id: currentColumn?.properties.col_id,
        status_code: "in process",
        color: "rgba(200,150,150, 0.5)",
        ...rest,
      }),
      h.if(currentColumn != null)(CurrentColumn, { feature: currentColumn }),
    ]
  );
}

export * from "./layers";
