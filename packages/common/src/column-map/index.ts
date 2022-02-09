import { useRef } from "react";
import h from "@macrostrat/hyper";
import { Globe } from "@macrostrat/map-components";
import { geoCentroid } from "d3-geo";
import { Land, Columns, CurrentColumn } from "common/map/layers";
import useSize from "@react-hook/size";

function ResizableMapFrame(props) {
  const { center, children, style, margin, className } = props;
  const ref = useRef(null);
  const [width, height] = useSize(ref);
  let scale = width;

  const zoomScaleExtent = [
    0.5 * Math.min(width, height),
    2 * Math.max(width, height)
  ];

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
        allowZoom: true,
        keepNorthUp: true,
        zoomScaleExtent
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
    ...rest
  } = props;

  const columnCenter = geoCentroid?.(currentColumn);

  return h(ResizableMapFrame, { center: columnCenter, style, margin }, [
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
