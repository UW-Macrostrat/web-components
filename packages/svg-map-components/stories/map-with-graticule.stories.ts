import { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";

export default {
  title: "SVG map components/With graticule",
  component: () => h("div", {}, "SVG Map Component"),
} as Meta;

import { useRef } from "react";
import { CoordinateAxis, Globe, GraticuleLabels, LandLayer } from "../src";
import { useElementSize } from "@macrostrat/ui-components";

export function BasicMap(props) {
  const { children, scale: _scale, className, center = [-132, 64.2] } = props;

  const margin = 20;

  const ref = useRef(null);
  const { width, height } = useElementSize(ref) ?? { width: 0, height: 0 };
  let scale = _scale ?? Math.min(width, height) + 2 * margin;

  const style = {
    height: "500px",
    width: "500px",
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

  const sharedLabelProps = {
    fill: "black",
    textAnchor: "middle",
    alignmentBaseline: "center",
    style: {
      fill: "var(--text-color)",
    },
  };

  return h(
    Globe,
    {
      width,
      height,
      margin,
      center,
      allowDrag: true,
      keepNorthUp: true,
      zoomScaleExtent,
      allowZoom,
      scale,
      ...rest,
    },
    [
      h(LandLayer),
      h(GraticuleLabels, {
        start: { x: 0, y: 0 },
        end: { x: 0, y: height - 2 * margin },
        axis: CoordinateAxis.Latitude,
        spacing: 10,
        labelProps: {
          ...sharedLabelProps,
          transform: `rotate(-90) translate(0 -4)`,
        },
      }),
      h(GraticuleLabels, {
        start: { x: 0, y: height - 2 * margin },
        end: { x: width - 2 * margin, y: height - 2 * margin },
        axis: CoordinateAxis.Longitude,
        spacing: 10,
        labelProps: {
          ...sharedLabelProps,
          transform: `translate(0 14)`,
        },
      }),
      children,
    ],
  );
}
