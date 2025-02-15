import h from "@macrostrat/hyper";

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

const NoteDefs = function ({ fill, prefix, size }) {
  if (prefix == null) {
    prefix = "";
  }
  return h("defs", [
    h(ArrowMarker, { id: prefix + "arrow_start", orient: 270, fill, size }),
    h(ArrowMarker, { id: prefix + "arrow_end", orient: 90, fill, size }),
    h(EndpointTick, { id: prefix + "tick", fill, size }),
  ]);
};

export default NoteDefs;
