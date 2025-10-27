import { scaleLinear } from "d3-scale";
import { useContext, createElement } from "react";
import h from "@macrostrat/hyper";
import { path } from "d3-path";
import { ColumnContext, ColumnCtx, ColumnDivision } from "./context";
import { UUIDComponent } from "./frame";

export function FloodingSurface(props: any) {
  const { scale, divisions } = useContext(ColumnContext);
  const { offsetLeft = -90, lineWidth = 50, onClick } = props;
  const floodingSurfaces = divisions.filter(
    (d) => d.flooding_surface_order != null,
  );
  if (!floodingSurfaces.length) {
    return null;
  }
  return h(
    "g.flooding-surface",
    null,
    floodingSurfaces.map(function (d) {
      const y = scale(d.bottom);
      const x = offsetLeft;

      return h("line.flooding-surface", {
        transform: `translate(${x} ${y})`,
        onClick,
        key: d.id,
        strokeWidth: (6 - Math.abs(d.flooding_surface_order)) * 0.75,
        stroke: d.flooding_surface_order >= 0 ? "#ccc" : "#fcc",
        x1: 0,
        x2: lineWidth,
      });
    }),
  );
}

function range(start: number, end: number): number[] {
  if (start === end) return [start];
  return [start, ...range(start + 1, end)];
}

interface TriangleBarsProps {
  offsetLeft: number;
  lineWidth: number;
  order: number;
  orders: number[];
  minOrder: number;
  maxOrder: number;
}

export class TriangleBars extends UUIDComponent<TriangleBarsProps> {
  constructor(props: TriangleBarsProps) {
    super(props);
    this.renderSurfaces = this.renderSurfaces.bind(this);
  }

  static contextType = ColumnContext;
  static defaultProps = {
    offsetLeft: -90,
    lineWidth: 50,
    order: 2,
  };

  context: ColumnCtx<ColumnDivision>;

  render() {
    let { offsetLeft, lineWidth, order, orders, minOrder, maxOrder } =
      this.props;
    const { scale, zoom, divisions } = this.context;

    if (orders == null && minOrder != null && maxOrder != null) {
      orders = range(minOrder, maxOrder);
    }

    const [bottom, top] = scale.range();
    if (orders == null && order != null) {
      orders = [order];
    }

    orders.reverse();

    const _ = path();

    const zigZagLine = function (x0, x1, y, nzigs = 5, a = 2) {
      //_.moveTo(start...)
      const xs = scaleLinear().domain([0, nzigs]).range([x0, x1]);

      _.lineTo(x0, y);

      for (
        let i = 0, end = nzigs, asc = 0 <= end;
        asc ? i < end : i > end;
        asc ? i++ : i--
      ) {
        const x_ = xs(i);
        let y_ = y;
        if (i % 2 === 1) {
          y_ += a;
        }
        _.lineTo(x_, y_);
      }

      return _.lineTo(x1, y);
    };

    const btm = bottom - top;
    _.moveTo(-lineWidth, 0);
    zigZagLine(-lineWidth, lineWidth, btm, 16, 3);
    zigZagLine(lineWidth, -lineWidth, 0, 16, 3);
    _.closePath();

    return h("g.triangle-bars", [
      h("defs", [
        createElement("clipPath", { id: this.UUID }, [
          h("path", { d: _.toString(), key: this.UUID + "-path" }),
        ]),
      ]),
      orders.map(this.renderSurfaces),
    ]);
  }

  renderSurfaces(order, index) {
    let d, i;
    const { scale, zoom, divisions } = this.context;
    const { offsetLeft, lineWidth } = this.props;
    if (!divisions.length) {
      return null;
    }
    const w = lineWidth / 2;
    const ol = offsetLeft + lineWidth * 2 + 5;
    const surfaces: SequenceStratSurface[] = [];

    for (i = 0; i < divisions.length; i++) {
      d = divisions[i];
      const { surface_type, surface_order } = d;
      if (surface_type == null || surface_order == null) {
        continue;
      }
      if (!(surface_order <= order)) {
        continue;
      }
      const height = scale(d.bottom);
      if (surface_type === "mfs") {
        surfaces.push(["mfs", height]);
      }
      if (surface_type === "sb") {
        if (surfaces.length === 0) {
          surfaces.push(["sb", height]);
          continue;
        }
        const sz = surfaces.length - 1;
        if (surfaces[sz][0] === "sb") {
          surfaces[sz][1] = height;
        } else {
          surfaces.push(["sb", height]);
        }
      }
    }

    if (!surfaces.length) {
      return null;
    }

    const _ = path();
    let basalMFS = null;
    let sequenceBoundary = null;
    for (i = 0; i < surfaces.length; i++) {
      const top = surfaces[i];
      if (top[0] === "mfs" && basalMFS != null) {
        _.moveTo(0, basalMFS[1]);
        if (sequenceBoundary != null) {
          _.lineTo(w, sequenceBoundary[1]);
          _.lineTo(0, top[1]);
          _.lineTo(-w, sequenceBoundary[1]);
          _.closePath();
        } else {
          _.lineTo(w, top[1]);
          _.lineTo(-w, top[1]);
          _.closePath();
        }
        sequenceBoundary = null;
        basalMFS = null;
      }
      if (top[0] === "mfs") {
        basalMFS = top;
      } else if (top[0] === "sb") {
        sequenceBoundary = top;
      }
    }

    return h(
      `g.level-${order}`,
      {
        clipPath: `url(#${this.UUID})`,
        transform: `translate(${-lineWidth * (2 + index) + ol})`,
        key: this.UUID + "-" + order,
      },
      [h("path", { d: _.toString(), key: this.UUID + "-" + order })],
    );
  }
}

type SequenceStratSurface = ["mfs" | "sb", number];
