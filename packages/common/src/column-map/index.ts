import { useRef } from "react";
import h from "@macrostrat/hyper";
import { Globe } from "@macrostrat/map-components";
import { geoCentroid } from "d3-geo";
import { Land, Columns, CurrentColumn } from "common/map/layers";
import useSize from "@react-hook/size";

function ResizableMapFrame(props) {
  const {
    center,
    children,
    style,
    margin,
    className,
    allowZoom,
    ...rest
  } = props;
  const ref = useRef(null);
  const [width, height] = useSize(ref);
  const scale = Math.max(width, height);

  let zoomScaleExtent = null;

  if (allowZoom) {
    zoomScaleExtent = [
      0.1 * Math.min(width, height),
      2 * Math.max(width, height)
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
        ...rest
      },
      [h(Land), children]
    )
  ]);
}

const ColumnMapNavigator = props => {
  const {
    currentColumn,
    setCurrentColumn,
    children,
    style,
    margin,
    scale,
    ...rest
  } = props;

  const columnCenter = geoCentroid(currentColumn);

  return h(ResizableMapFrame, { center: columnCenter, style, margin, scale }, [
    children,
    h(Columns, {
      onChange: setCurrentColumn,
      col_id: currentColumn?.properties.col_id,
      ...rest
    }),
    h.if(currentColumn != null)(CurrentColumn, { feature: currentColumn })
  ]);
};

ColumnMapNavigator.defaultProps = {
  margin: 10
};

export * from "./layers";
export { ColumnMapNavigator, ResizableMapFrame };
