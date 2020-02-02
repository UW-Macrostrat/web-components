/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {scaleLinear, scaleOrdinal} from "d3-scale";
import {Component, createContext} from "react";
import h from "react-hyperscript";
import T from "prop-types";
import {ColumnContext} from './column';

//# This isn't really used yet...

const ColumnLayoutContext = createContext({
  scale: null,
  width: 0,
  divisions: []
});

class ColumnLayoutProvider extends Component {
  static propTypes = {
    width: T.number.isRequired
  };
  static contextType = ColumnContext;
  render() {
    const {children, ...rest} = this.props;
    const value = {...this.context, ...rest};
    console.log(value)
    return h(ColumnLayoutContext.Provider, {value}, children);
  }
}

class CrossAxisLayoutProvider extends Component {
  static propTypes = {
    width: T.number.isRequired,
    domain: T.arrayOf(T.number).isRequired,
    range: T.arrayOf(T.number)
  };
  static contextType = ColumnContext;
  render() {
    let {domain, range, width, children} = this.props;
    if (range == null) {
      range = [0, width];
    }
    const xScale = scaleLinear().domain(domain).range(range);
    return h(ColumnLayoutProvider, {
      xScale,
      width,
      children
    });
  }
}

class GrainsizeLayoutProvider extends Component {
  /**
  Right now this provides a ColumnLayoutContext
  but it could be reworked to provide a
  separate "GrainsizeLayoutContext" if that seemed
  appropriate.
  */
  constructor(...args) {
    super(...args);
    this.grainsizeScale = this.grainsizeScale.bind(this);
    this.grainsizeForDivision = this.grainsizeForDivision.bind(this);
    this.widthForDivision = this.widthForDivision.bind(this);
  }
  static contextType = ColumnContext;
  static propTypes = {
    width: T.number.isRequired,
    grainsizeScaleStart: T.number,
    grainSizes: T.arrayOf(T.string)
  };
  static defaultProps = {
    grainSizes: ['ms','s','vf','f','m','c','vc','p'],
    grainsizeScaleStart: 50
  };
  grainsizeScale() {
    const {grainSizes, width, grainsizeScaleStart} = this.props;
    const scale = scaleLinear()
      .domain([0,grainSizes.length-1])
      .range([grainsizeScaleStart, width]);
    return scaleOrdinal()
      .domain(grainSizes)
      .range(grainSizes.map((d,i)=> scale(i)));
  }

  grainsizeForDivision(division){
    const {divisions} = this.context;
    let ix = divisions.indexOf(division);
    // Search backwards through divisions
    while (ix > 0) {
      const {grainsize} = divisions[ix];
      if (grainsize != null) { return grainsize; }
      ix -= 1;
    }
  }

  widthForDivision(division){
    if (division == null) { return this.props.width; }
    const gs = this.grainsizeScale();
    return gs(this.grainsizeForDivision(division));
  }

  render() {
    const {width, grainSizes, grainsizeScaleStart, children} = this.props;
    const grainsizeScaleRange = [grainsizeScaleStart, width];
    // This is slow to run each iteration
    return h(ColumnLayoutProvider, {
      width,
      grainSizes,
      grainsizeScale: this.grainsizeScale(),
      grainsizeScaleStart,
      grainsizeScaleRange,
      grainsizeForDivision: this.grainsizeForDivision,
      widthForDivision: this.widthForDivision,
    }, children);
  }
}

export {
  ColumnLayoutContext,
  ColumnLayoutProvider,
  CrossAxisLayoutProvider,
  GrainsizeLayoutProvider
};
