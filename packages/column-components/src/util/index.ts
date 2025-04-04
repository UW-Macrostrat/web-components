import h from "@macrostrat/hyper";
import {
  createElement,
  forwardRef,
  ForwardedRef,
  SVGAttributes,
  RefObject,
} from "react";
import {
  expandInnerSize,
  extractPadding,
  removePadding,
  extractMargin,
  removeMargin,
  Padding,
  Margin,
} from "@macrostrat/ui-components";
import { useColumn } from "../context";
import classNames from "classnames";

const SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg",
  xmlnsXlink: "http://www.w3.org/1999/xlink",
};

interface SVGProps extends SVGAttributes<any>, Padding, Margin {
  innerHeight?: number;
  innerWidth?: number;
  innerRef?: RefObject<SVGElement>;
}

const SVG = forwardRef((props: SVGProps, ref: ForwardedRef<SVGElement>) => {
  const { innerRef, children, style, ...rest } = expandInnerSize(props);
  if (innerRef != null) {
    ref = innerRef;
  }

  // Sizing
  const { paddingLeft, paddingTop } = extractPadding(props);
  const margin = extractMargin(props);
  const realRest = removeMargin(removePadding(rest));

  return h(
    "svg",
    {
      ref,
      style: { ...margin, ...style },
      ...realRest,
      ...SVGNamespaces,
    },
    h(
      "g",
      {
        transform: `translate(${paddingLeft},${paddingTop})`,
      },
      children
    )
  );
});

const ForeignObject = (props) => createElement("foreignObject", props);

const ColumnSVG = function (props: SVGProps) {
  //# Need to rework to use UI Box code
  const { children, className, innerRef, style, ...rest } = props;
  const { pixelHeight } = useColumn();
  const nextProps = expandInnerSize({ innerHeight: pixelHeight, ...rest });
  const {
    paddingLeft,
    paddingTop,
    innerHeight,
    innerWidth,
    height,
    width,
    ...remainingProps
  } = nextProps;
  return h(
    SVG,
    {
      className: classNames(className, "section"),
      height,
      width,
      innerRef,
      ...remainingProps,
      style,
    },
    h(
      "g.backdrop",
      {
        transform: `translate(${paddingLeft},${paddingTop})`,
      },
      children
    )
  );
};

export { SVGNamespaces, SVG, ColumnSVG, ForeignObject };

export * from "./storage";
export * from "./column-box";
export * from "./scroll-box";
