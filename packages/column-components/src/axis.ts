/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component } from "react"
import { findDOMNode } from "react-dom"
import h from "react-hyperscript"
import { select } from "d3-selection"
import { axisLeft } from "d3-axis"
import { ColumnContext } from "./context"

class ColumnAxis extends Component {
  // https://github.com/d3/d3-axis
  static contextType = ColumnContext
  static __d3axisKeys = [
    "ticks",
    "tickArguments",
    "tickValues",
    "tickFormat",
    "tickSize",
    "tickSizeInner",
    "tickSizeOuter",
    "tickPadding",
  ]
  static defaultProps = {
    ticks: 4,
    showLabel() {
      return true
    },
    showDomain: true,
  }
  render() {
    return h("g.y.axis")
  }
  componentDidUpdate() {
    const { scale } = this.context
    const { showLabel } = this.props
    this.yAxis.scale(scale)

    for (let k of this.constructor.__d3axisKeys) {
      if (this.props[k] == null) continue
      this.yAxis[k](this.props[k])
    }

    const ax = select(findDOMNode(this)).call(this.yAxis)

    if (!this.props.showDomain) {
      ax.select(".domain").remove()
    }

    // Hide labels if they match the showLabel predicate
    return ax.selectAll(".tick text").each(function (d) {
      const v = showLabel(d)
      if (v) {
        return
      }
      return select(this).attr("visibility", "hidden")
    })
  }

  componentDidMount() {
    this.yAxis = axisLeft()
    this.componentDidUpdate()
  }
}

export { ColumnAxis }
