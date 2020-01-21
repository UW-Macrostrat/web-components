/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {scaleLinear, scaleOrdinal} from "d3-scale";
import {Component} from "react";
import {ColumnLayoutContext} from './context';
import h from "react-hyperscript";

const grainSizes = ['ms','s','vf','f','m','c','vc','p'];
const createGrainsizeScale = function(range){
  const mn = grainSizes.length-1;
  const scale = scaleLinear()
    .domain([0,mn])
    .range(range);
  return scaleOrdinal()
    .domain(grainSizes)
    .range(grainSizes.map((d,i)=> scale(i)));
};

class GrainsizeAxis extends Component {
  static initClass() {
    this.contextType = ColumnLayoutContext;
    this.defaultProps = {
      height: 20
    };
  }
  render() {
    const {grainsizeScale: gs, pixelHeight} = this.context;
    if ((gs == null)) {
      throw "GrainsizeAxis must be wrapped in a GrainsizeColumn component";
    }
    const sizes = gs.domain();
    return h('g.grainsize.axis', sizes.map(d=> {
      return h('g.tick', {transform: `translate(${gs(d)} 0)`, key: d}, [
        h('text.top', {y: 0}, d),
        h('text.bottom', {y: pixelHeight}, d),
        h('line', {y1: 0, x1: 0, x2: 0, y2: pixelHeight})
      ]);
  }));
  }
}
GrainsizeAxis.initClass();

export {GrainsizeAxis, grainSizes, createGrainsizeScale};
