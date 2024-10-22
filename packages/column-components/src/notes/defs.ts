/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { findDOMNode } from "react-dom";
import { Component, createElement } from "react";
import h from "@macrostrat/hyper";
import T from "prop-types";

const ArrowMarker = function ({ id, orient, size: sz, fill }) {
  if (fill == null) {
    fill = "black";
  }
  if (sz == null) {
    sz = 4;
  }
  return h(
    "marker",
    {
      id,
      orient,
      markerHeight: sz,
      markerWidth: sz,
      markerUnits: "strokeWidth",
      refX: "0",
      refY: "0",
      viewBox: `-${sz} -${sz} ${sz * 2} ${sz * 2}`,
    },
    [
      h("path", {
        d: `M 0,0 m -${sz},-${sz} L ${sz},0 L -${sz},${sz} Z`,
        fill,
      }),
    ]
  );
};

const EndpointTick = function ({ id, fill, size: sz }) {
  if (fill == null) {
    fill = "black";
  }
  if (sz == null) {
    sz = 4;
  }
  return h(
    "marker",
    {
      id,
      markerHeight: 2,
      markerWidth: sz * 2,
      markerUnits: "strokeWidth",
      refX: 0,
      refY: 0,
      viewBox: `-${sz} -1 ${sz * 2} 1`,
    },
    [
      h("path", {
        d: `M -${sz},0 L ${sz},0`,
        fill: "transparent",
        stroke: fill,
      }),
    ]
  );
};

const NoteDefs = function ({ fill, prefix }) {
  if (prefix == null) {
    prefix = "";
  }
  return h("defs", [
    h(ArrowMarker, { id: prefix + "arrow_start", orient: 270, fill }),
    h(ArrowMarker, { id: prefix + "arrow_end", orient: 90, fill }),
    h(EndpointTick, { id: prefix + "tick", fill }),
  ]);
};

export default NoteDefs;
