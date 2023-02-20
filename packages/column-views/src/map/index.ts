import { useRef } from "react";
import h from "@macrostrat/hyper";
import { Globe, LandLayer } from "@macrostrat/map-components";
import { geoCentroid } from "d3-geo";
import { useElementSize } from "@macrostrat/ui-components";

function ResizableMapFrame(props) {
  const { center, children, style, margin, className, allowZoom, ...rest } =
    props;
  const ref = useRef(null);
  const { width, height } = useElementSize(ref);
  const scale = Math.max(width, height);

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
        scale,
        center,
        allowDrag: true,
        allowZoom,
        keepNorthUp: true,
        zoomScaleExtent,
        ...rest,
      },
      [h(LandLayer), children]
    ),
  ]);
}

const ColumnNavigatorMap = (props) => {
  const {
    currentColumn,
    setCurrentColumn,
    children,
    style,
    margin = 10,
    scale,
    ...rest
  } = props;

  const columnCenter = geoCentroid(currentColumn);

  return h(ResizableMapFrame, { center: columnCenter, style, margin, scale }, [
    children,
    h(Columns, {
      onChange: setCurrentColumn,
      col_id: currentColumn?.properties.col_id,
      ...rest,
    }),
    h.if(currentColumn != null)(CurrentColumn, { feature: currentColumn }),
  ]);
};

export * from "./layers";
export { ColumnNavigatorMap, ResizableMapFrame };
