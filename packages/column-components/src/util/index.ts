/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from "react-hyperscript";
import { createElement, useContext, forwardRef, createRef } from "react";
import {
  expandInnerSize,
  extractPadding,
  removePadding,
  extractMargin,
  removeMargin
} from "./box-model";
import { ColumnContext } from "../context";
import Box from "ui-box";
import classNames from "classnames";

const SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg",
  xmlnsXlink: "http://www.w3.org/1999/xlink"
};

const SVG = forwardRef(function(props, ref) {
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
      style: { ...style, ...margin },
      ...realRest,
      ...SVGNamespaces
    },
    h(
      "g",
      {
        transform: `translate(${paddingLeft},${paddingTop})`
      },
      children
    )
  );
});

const ForeignObject = props => createElement("foreignObject", props);

const ColumnSVG = function(props) {
  //# Need to rework to use UI Box code
  const { children, className, innerRef, ...rest } = props;
  const { pixelHeight } = useContext(ColumnContext);
  const nextProps = expandInnerSize({ innerHeight: pixelHeight, ...rest });
  const {
    paddingLeft,
    paddingTop,
    innerHeight,
    innerWidth,
    height,
    width
  } = nextProps;
  return h(
    SVG,
    {
      className: classNames(className, "section"),
      height,
      width,
      innerRef
    },
    h(
      "g.backdrop",
      {
        transform: `translate(${paddingLeft},${paddingTop})`
      },
      children
    )
  );
};

export { SVGNamespaces, SVG, ColumnSVG, ForeignObject };

import LocalStorage from "./storage";

export * from "./column-box";
export * from "./box-model";
export * from "./scroll-box";
export { LocalStorage };
