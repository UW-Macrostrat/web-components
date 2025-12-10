import { useContext } from "react";
import h from "../hyper";
import { NoteLayoutContext } from "./layout";

interface HeightRangeAnnotationProps {
  height: number;
  top_height?: number;
  offsetX?: number;
  color?: string;
  lineInset?: number;
  circleRadius?: number;
}

function HeightRangeAnnotation(props: HeightRangeAnnotationProps) {
  const { scale } = useContext(NoteLayoutContext);
  const {
    height,
    top_height,
    offsetX = 0,
    color,
    lineInset = 1,
    circleRadius = 2,
    ...rest
  } = props;

  const bottomHeight = scale(height);
  let pxHeight = 0;
  if (top_height != null) {
    pxHeight = Math.abs(scale(top_height) - bottomHeight);
  }
  const topHeight = bottomHeight - pxHeight;

  /* Use a value slightly greater than the circle diameter as the cutoff
    to switch between line and circle, to account for a circle's greater
    visual weight than the equivalent line height
   */
  const isLine = pxHeight > 3 * Math.max(lineInset, circleRadius);

  const transform = `translate(${offsetX},${topHeight})`;

  return h("g.height-range", { transform, ...rest }, [
    h.if(isLine)("line", {
      x1: 0,
      x2: 0,
      y1: lineInset,
      y2: pxHeight - lineInset,
    }),
    h.if(!isLine)("circle", {
      r: circleRadius,
      transform: `translate(0,${pxHeight / 2})`,
    }),
  ]);
}

export { HeightRangeAnnotation };
