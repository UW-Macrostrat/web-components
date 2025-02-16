import { Component } from "react";
import { findDOMNode } from "react-dom";
import h from "./hyper";
import { select } from "d3-selection";
import { axisLeft } from "d3-axis";
import { ColumnContext, ColumnCtx, ColumnDivision } from "./context";

interface ColumnAxisProps {
  ticks?: number;
  tickArguments?: any;
  tickValues?: any;
  tickFormat?: any;
  tickSize?: any;
  tickSizeInner?: any;
  tickSizeOuter?: any;
  tickPadding?: any;
  showLabel?: (d: any) => boolean;
  showDomain?: boolean;
}

export class ColumnAxis extends Component<ColumnAxisProps> {
  // https://github.com/d3/d3-axis
  static contextType = ColumnContext;
  context: ColumnCtx<ColumnDivision>;
  static __d3axisKeys = [
    "ticks",
    "tickArguments",
    "tickValues",
    "tickFormat",
    "tickSize",
    "tickSizeInner",
    "tickSizeOuter",
    "tickPadding",
  ];
  yAxis: any;

  static defaultProps = {
    ticks: 4,
    showLabel() {
      return true;
    },
    showDomain: true,
  };
  render() {
    return h("g.y.axis.column-axis");
  }
  componentDidUpdate() {
    const { scale } = this.context;
    const { showLabel } = this.props;
    this.yAxis.scale(scale);

    for (let k of ColumnAxis.__d3axisKeys) {
      if (this.props[k] == null) continue;
      this.yAxis[k](this.props[k]);
    }

    const ax = select(findDOMNode(this) as HTMLElement).call(this.yAxis);

    if (!this.props.showDomain) {
      ax.select(".domain").remove();
    }

    // Hide labels if they match the showLabel predicate
    return ax.selectAll(".tick text").each(function (d) {
      const v = showLabel(d);
      if (v) {
        return;
      }
      return select(this).attr("visibility", "hidden");
    });
  }

  componentDidMount() {
    this.yAxis = axisLeft();
    this.componentDidUpdate();
  }
}
