import h from "@macrostrat/hyper";
import { useContext } from "react";
import { ColumnContext } from "../context";
import classNames from "classnames";
import { Box } from "@macrostrat/ui-components";
import { path } from "d3-path";
import type { Path } from "d3-path";

// This could be merged with ColumnSVG
export function ColumnBox(props: any) {
  const { offsetTop, absolutePosition, className, ...rest } = props;
  const { pixelsPerMeter, zoom } = useContext(ColumnContext);

  const marginTop = offsetTop * pixelsPerMeter * zoom;
  let pos: any = { marginTop };
  if (absolutePosition) {
    pos = {
      position: "absolute",
      top: marginTop,
    };
  }

  return h(Box, {
    className: classNames("column-box", className),
    ...pos,
    ...rest,
  });
}

export function zigZagBoxPath(
  x,
  y,
  width,
  height,
  top: boolean,
  bottom: boolean,
) {
  const d = path();

  const x1 = x + width;
  // Start path at the top
  d.moveTo(x, y);
  if (top) {
    drawZigZagAtConstantHeight(d, x, x1, y);
  } else {
    d.lineTo(x1, y);
  }
  const yBottom = y + height;
  d.lineTo(x1, yBottom);
  // Draw the bottom
  if (bottom) {
    drawZigZagAtConstantHeight(d, x1, x, yBottom);
  } else {
    d.lineTo(x, yBottom);
  }
  // Draw the left edge
  d.closePath();

  // Now render the path;
  return d.toString();
}

export function drawZigZagAtConstantHeight(d: Path, x0, x1, y) {
  const zigZagWidth = 10;
  const zigZagHeight = 4;

  const deltaX = x1 - x0;
  const width = Math.abs(deltaX);

  const nZigZags = Math.floor(width / zigZagWidth - 0.5);
  const _zigZagWidth = width / (nZigZags + 0.5);

  let dy = zigZagHeight / 2;
  // Each zig-zag consists of a short outward motion
  let dx = _zigZagWidth / 4;

  let cx = x0;
  let cy = y;

  if (deltaX < 0) {
    dx = -dx;
    dy = -dy;
  }

  const doZigZag = (last = false) => {
    cx += dx;
    cy -= dy;
    d.lineTo(cx, cy);
    let scalar = last ? 1 : 2;
    cx += dx * scalar;
    cy += dy * scalar;
    d.lineTo(cx, cy);
    cx += dx;
    cy -= dy;
  };

  d.lineTo(x0, y);

  // Move to the offset
  //d.lineTo(cx, y);
  // Draw the zig-zags
  for (let i = 0; i < nZigZags; i++) {
    doZigZag();
  }
  // Draw the last half zig-zag
  doZigZag(true);
  // Draw to the edge
  d.lineTo(x1, y);
}
