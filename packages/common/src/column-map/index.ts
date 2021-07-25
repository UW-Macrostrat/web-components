import { useRef } from "react";
import h from "@macrostrat/hyper";
import { Globe } from "@macrostrat/map-components";
import { geoCentroid } from "d3-geo";
import { Land, Columns, CurrentColumn } from "common/map/layers";
import useSize from "@react-hook/size";

const ColumnMapNavigator = props => {
  const { currentColumn, setCurrentColumn, children, ...rest } = props;

  const ref = useRef(null);
  const [width, height] = useSize(ref);

  const columnCenter = geoCentroid?.(currentColumn);

  const { margin } = props;

  let scale = width;

  return h("div.map-area", { ref }, [
    h(
      Globe,
      {
        width,
        height,
        margin,
        scale,
        center: columnCenter,
        allowDrag: true,
        allowZoom: true,
        keepNorthUp: true
        //translate: [width / 2 - scale, height - scale],
        //rotation: [-columnCenter[0], -columnCenter[1]],
      },
      [
        h(Land),
        children,
        h(Columns, {
          onChange: setCurrentColumn,
          col_id: currentColumn?.properties.col_id,
          ...rest
        }),
        h.if(currentColumn != null)(CurrentColumn, { feature: currentColumn })
      ]
    )
  ]);
};

ColumnMapNavigator.defaultProps = {
  margin: 10
};

export * from "./layers";
export { ColumnMapNavigator };
