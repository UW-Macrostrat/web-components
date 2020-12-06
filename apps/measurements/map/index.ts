import { useState, useRef } from "react";
import h from "@macrostrat/hyper";
import { Globe } from "@macrostrat/map-components";
import { geoCentroid } from "d3-geo";
import { Land, Columns, CurrentColumn } from "common/map/layers";
import classNames from "classnames";
import useSize from "@react-hook/size";

const MapView = props => {
  const { currentColumn, setCurrentColumn, children } = props;

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
        allowZoom: false,
        keepNorthUp: true
      },
      [
        h(Land),
        children,
        h(Columns, {
          onChange: setCurrentColumn,
          col_id: currentColumn?.properties.col_id
        }),
        h.if(currentColumn != null)(CurrentColumn, { feature: currentColumn })
      ]
    )
  ]);
};

MapView.defaultProps = {
  margin: 10
};

export * from "./layers";
export { MapView };
