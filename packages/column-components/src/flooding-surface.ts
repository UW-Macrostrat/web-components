/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//import {query} from "app/sections/db"
import {scaleLinear} from 'd3-scale';
import {Component, createElement} from "react";
import h from "react-hyperscript";
//import {Notification} from "app/notify"
import {path} from "d3-path";
import {ColumnContext} from "./context";
import {UUIDComponent} from './frame';

class FloodingSurface extends Component {
  static initClass() {
    this.contextType = ColumnContext;
    this.defaultProps = {
      offsetLeft: -90,
      lineWidth: 50
    };
  }
  render() {
    const {scale, zoom, divisions} = this.context;
    const {offsetLeft, lineWidth} = this.props;
    const floodingSurfaces = divisions.filter(d => d.flooding_surface_order != null);
    if (!floodingSurfaces.length) { return null; }
    return h('g.flooding-surface', null, floodingSurfaces.map(function(d){
      const y = scale(d.bottom);
      const x = offsetLeft;
      const transform = `translate(${x} ${y})`;
      let onClick = null;
      if (d.note != null) {
        onClick = () => Notification.show({
          message: d.note
        });
      }
      return h("line.flooding-surface", {
        transform,
        onClick,
        key: d.id,
        strokeWidth: (6-Math.abs(d.flooding_surface_order))*.75,
        stroke: d.flooding_surface_order >= 0 ? '#ccc' : '#fcc',
        x1: 0,
        x2: lineWidth
      });}));
  }
}
FloodingSurface.initClass();

class TriangleBars extends UUIDComponent {
  constructor(...args) {
    super(...args);
    this.renderSurfaces = this.renderSurfaces.bind(this);
  }

  static initClass() {
    this.contextType = ColumnContext;
    this.defaultProps = {
      offsetLeft: -90,
      lineWidth: 50,
      order: 2
    };
  }

  render() {
    let {offsetLeft, lineWidth, order, orders} = this.props;
    const {scale, zoom, divisions} = this.context;
    const [bottom, top] = scale.range();
    if (orders == null) { orders = [order]; }

    const _ = path();

    const zigZagLine = function(x0, x1, y, nzigs=5, a=2){
      //_.moveTo(start...)
      const xs = scaleLinear()
        .domain([0,nzigs])
        .range([x0,x1]);

      _.lineTo(x0,y);

      for (let i = 0, end = nzigs, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        const x_ = xs(i);
        let y_ = y;
        if ((i%2) === 1) {
          y_ += a;
        }
        _.lineTo(x_,y_);
      }

      return _.lineTo(x1,y);
    };


    const btm = bottom-top;
    _.moveTo(-lineWidth,0);
    zigZagLine(-lineWidth, lineWidth, btm, 16, 3);
    zigZagLine(lineWidth, -lineWidth, 0, 16, 3);
    _.closePath();

    return h('g.triangle-bars', {}, [
      h('defs', [
        createElement('clipPath', {id: this.UUID}, [
          h('path', {d: _.toString(), key: this.UUID+'-path'})
        ])
      ]),
      orders.map(this.renderSurfaces)
    ]);
  }

  renderSurfaces(order, index){
    let d, i;
    const {scale, zoom, divisions} = this.context;
    const {offsetLeft, lineWidth} = this.props;
    if (!divisions.length) { return null; }
    const w = lineWidth/2;
    const ol = offsetLeft+(lineWidth*2)+5;
    const __ = [];

    for (i = 0; i < divisions.length; i++) {
      d = divisions[i];
      const {surface_type, surface_order} = d;
      if ((surface_type == null) || (surface_order == null)) { continue; }
      if (!(surface_order <= order)) { continue; }
      const height = scale(d.bottom);
      if (surface_type === 'mfs') {
        __.push(['mfs', height]);
      }
      if (surface_type === 'sb') {
        if (__.length === 0) {
          __.push(['sb', height]);
          continue;
        }
        const sz = __.length-1;
        if (__[sz][0] === 'sb') {
          __[sz][1] = height;
        } else {
          __.push(['sb', height]);
        }
      }
    }

    if (!__.length) { return null; }

    const _ = path();
    let basalMFS = null;
    let sequenceBoundary = null;
    for (i = 0; i < __.length; i++) {
      const top = __[i];
      if ((top[0] === 'mfs') && (basalMFS != null)) {
        _.moveTo(0,basalMFS[1]);
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
      if (top[0] === 'mfs') {
        basalMFS = top;
      } else if (top[0] === 'sb') {
        sequenceBoundary = top;
      }
    }

    return h(`g.level-${order}`, {
      clipPath: `url(#${this.UUID})`,
      transform: `translate(${(-lineWidth*(2+index))+ol})`,
      key: this.UUID+'-'+order
    }, [
      h("path", {d: _.toString(), key: this.UUID+'-'+order})
    ]);
  }
}
TriangleBars.initClass();

export {FloodingSurface, TriangleBars};
