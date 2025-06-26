import { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";

export default {
  title: "SVG map components/SVG map component",
  component: () => h("div", {}, "SVG Map Component"),
} as Meta;

import { useRef } from "react";
import { Globe, LandLayer } from "../src";
import { useElementSize } from "@macrostrat/ui-components";

export function BasicMap(props) {
  const {
    children,
    margin = 10,
    scale: _scale,
    className,
    center = [-132, 64.2],
  } = props;

  const ref = useRef(null);
  const { width, height } = useElementSize(ref) ?? { width: 0, height: 0 };
  let scale = _scale ?? Math.min(width, height) + 2 * margin;

  const style = {
    height: "500px",
  };

  return h("div.map-area", { ref, style, className }, [
    h(
      GlobeInner,
      {
        width,
        height,
        margin,
        center,
        allowDrag: true,
        keepNorthUp: true,
        scale,
      },
      children,
    ),
  ]);
}

function GlobeInner({
  width,
  height,
  scale: _scale,
  margin,
  children,
  center,
  ...rest
}) {
  if (width == null || height == null) {
    return null;
  }

  let scale = _scale ?? Math.min(width, height) + 2 * margin;

  const allowZoom = true;
  let zoomScaleExtent = null;

  if (allowZoom) {
    zoomScaleExtent = [
      0.1 * Math.min(width, height),
      2 * Math.max(width, height),
    ];
  }

  return h(
    Globe,
    {
      width,
      height,
      margin: 0,
      center,
      allowDrag: true,
      keepNorthUp: true,
      zoomScaleExtent,
      allowZoom,
      scale,
      ...rest,
    },
    [h(LandLayer), children],
  );
}
