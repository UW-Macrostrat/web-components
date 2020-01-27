/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {select} from "d3-selection";
import {Component, PureComponent, createElement, useContext} from "react";
import {findDOMNode} from "react-dom";
import h from "react-hyperscript";
import classNames from "classnames";
import {path} from "d3-path";
import T from 'prop-types';
import {SimpleFrame, GrainsizeFrame, ClipToFrame, UUIDComponent} from '../frame';
import {FaciesContext, ColumnContext, ColumnLayoutContext,
        AssetPathContext, ColumnLayoutProvider} from "../context";
import {GeologicPattern, GeologicPatternProvider} from './patterns.ts';
import {createGrainsizeScale} from "../grainsize";

// Malformed es6 module
let v = require('react-svg-textures');
if (v.default != null) {
  v = v.default;
}
const {Lines} = v;

const symbolIndex = {
  'dolomite-limestone': 641,
  'lime_mudstone': 627,
  'sandstone': 607,
  'siltstone': 616,
  'dolomitic siltstone': 616,
  'shale': 620,
  'limestone': 627,
  'dolomite': 642,
  'conglomerate': 602,
  'dolomite-mudstone': 642,
  'mudstone': 620,
  'sandy-dolomite': 645,
  'quartzite': 702
};

const isCarbonateSymbol = function(d){
  /*
  Does this FGDC pattern correspond to a carbonate rock?
  */
  if (d < 627) {
    return false;
  }
  if (d > 648) {
    return false;
  }
  return true;
};

const defaultResolveID = function(d){
  // Changed pattern to lithology
  if (d == null) { return null; }
  if (!((d.fgdc_pattern != null) || (d.pattern != null))) {
    return null;
  }
  if (d.fgdc_pattern != null) {
    return `${d.fgdc_pattern}`;
  }
  return `${symbolIndex[d.pattern]}`;
};

const carbonateResolveID = function(d){
  // Just whether a carbonate or not
  v = defaultResolveID(d);
  if ((v == null)) { return v; }
  if (isCarbonateSymbol(v)) { return 627; } else { return -1; }
};

const __divisionSize = function(d){
  let {bottom,top} = d;
  if (top < bottom) {
    [top,bottom] = [bottom,top];
  }
  return [bottom, top];
};

class ColumnRect extends Component {
  static initClass() {
    this.contextType = ColumnContext;
    this.propTypes = {
      division: T.object.isRequired,
      padWidth: T.bool
    };
    this.defaultProps = {
      padWidth: false
    };
  }
  render() {
    const {scale} = this.context;
    let {division: d, padWidth, key, width, ...rest} = this.props;
    const [bottom,top] = __divisionSize(d);
    const y = scale(top);
    let x = 0;
    if (padWidth) {
      x -= 5;
      width += 10;
    }
    const height = scale(bottom)-y;
    if (key == null) { key = d.id; }
    return h("rect", {x,y, width, height, key, ...rest});
  }
}
ColumnRect.initClass();

const expandDivisionsByKey = function(divisions, key){
  const __ = [{...divisions[0]}];
  for (let d of Array.from(divisions)) {
    const ix = __.length-1;
    const shouldSkip = (d[key] == null) || (d[key] === __[ix][key]);
    if (shouldSkip) {
      __[ix].top = d.top;
    } else {
      __.push({...d});
    }
  }
  return __;
  if (__.length === 1) { return null; }
};

const ParameterIntervals = function(props){
  const {divisions, width} = useContext(ColumnLayoutContext);
  const {
    padWidth,
    parameter: key,
    fillForInterval,
    minimumHeight
  } = props;
  const newDivisions = expandDivisionsByKey(divisions, key);
  if (newDivisions.length === 1) { return null; }
  return h('g', {className: key}, newDivisions.map(div => h(ColumnRect, {
    className: classNames(key, div.id),
    division: div,
    padWidth,
    fill: fillForInterval(div[key], div),
    width
  })));
};

ParameterIntervals.propTypes = {
  padWidth: T.number,
  parameter: T.string.isRequired,
  fillForInterval: T.func.isRequired
};

const FaciesColumnInner = function(props){
  const {getFaciesColor} = useContext(FaciesContext);
  return h(ParameterIntervals, {
    parameter: 'facies',
    fillForInterval(param, division){
      const {facies, facies_color} = division;
      return getFaciesColor(facies) || facies_color;
    },
    ...props
  });
};

class CoveredOverlay extends UUIDComponent {
  static initClass() {
    this.contextType = ColumnLayoutContext;
  }
  render() {
    const {divisions, width} = this.context;
    const divs = divisions.filter(d => d.covered).map(d=> {
      return h(ColumnRect, {division: d, width, fill: `url(#${this.UUID}-covered)`});
  });

    return h('g.covered-overlay', {}, [
      h('defs', [
        h(Lines, {
          id: `${this.UUID}-covered`,
          size: 9,
          strokeWidth: 3,
          stroke: 'rgba(0,0,0,0.5)'
        })
      ]),
      ...divs
    ]);
  }
}
CoveredOverlay.initClass();

const LithologySymbolDefs = function(props){
  let {resolveID, divisions, UUID, scalePattern} = props;
  if (scalePattern == null) { scalePattern = () => 1; }
  if (divisions == null) { ({
    divisions
  } = useContext(ColumnContext)); }

  const __ = divisions
    .map(d => resolveID(d))
    .filter((x, i, arr) => arr.indexOf(x) === i);

  return h('defs', __.map(function(id, i){
    if (id === -1) { return null; }
    let sz = 100;
    if (scalePattern != null) {
      const scalar = scalePattern(id);
      sz *= scalar;
    }
    return h(GeologicPattern, {key: i, UUID, id, width: sz, height: sz});}));
};

class LithologyBoxes extends UUIDComponent {
  constructor(...args) {
    super(...args);
    this.constructLithologyDivisions = this.constructLithologyDivisions.bind(this);
    this.renderEach = this.renderEach.bind(this);
  }

  static initClass() {
    this.contextType = ColumnLayoutContext;
    this.defaultProps = {
      resolveID: defaultResolveID,
      minimumHeight: 0
    };
  }
  constructLithologyDivisions() {
    let d, patternID;
    const {divisions} = this.context;
    const {resolveID, minimumHeight} = this.props;
    const __ = [];
    for (d of Array.from(divisions)) {
      const ix = __.length-1;
      patternID = resolveID(d);
      if (ix === -1) {
        __.push({...d, patternID});
        continue;
      }
      const sameAsLast = patternID === resolveID(__[ix]);
      const shouldSkip = (patternID == null) || sameAsLast;
      if (shouldSkip) {
        __[ix].top = d.top;
      } else {
        __.push({...d, patternID});
      }
    }

    // Allow removing of items by minimum height
    if (minimumHeight > 0) {
      const nextVals = [];
      for (let i = 0; i < __.length; i++) {
        d = __[i];
        const heightTooSmall = (d.top-d.bottom) < minimumHeight;
        if (heightTooSmall && (__[i+1] != null)) {
          var name;
          __[i+1].bottom = d.bottom;
          if (__[name = i+1].patternID == null) { __[name].patternID = resolveID(d); }
        } else {
          nextVals.push(d);
        }
      }
      return nextVals;
    }
    return __;
  }

  renderEach(d){
    const {width} = this.context;
    const className = classNames({
      definite: d.definite_boundary,
      covered: d.covered}, 'lithology');
    let fill = `url(#${this.UUID}-${d.patternID})`;
    if (d.patternID === -1) {
      fill = 'transparent';
    }
    return h(ColumnRect, {width, division: d, className, fill});
  }

  render() {
    const divisions = this.constructLithologyDivisions();
    const {resolveID} = this.props;
    return h('g.lithology', [
      h(LithologySymbolDefs, {
        divisions,
        resolveID,
        UUID: this.UUID
      }),
      h('g', divisions.map(this.renderEach))
    ]);
  }
}
LithologyBoxes.initClass();

const LithologyColumnInner = LithologyBoxes;

class LithologyColumn extends Component {
  constructor(...args) {
    super(...args);
    this.computeTransform = this.computeTransform.bind(this);
  }

  static initClass() {
    this.defaultProps = {
      // Should align exactly with centerline of stroke
      shiftY: 0.5,
      left: 0
    };
    this.propTypes = {
      width: T.number.isRequired
    };
  }
  computeTransform() {
    const {left, shiftY} = this.props;
    if (left == null) { return null; }
    return `translate(${left} ${shiftY})`;
  }

  render() {
    const {left, shiftY, width, children} = this.props;
    const transform = this.computeTransform();

    return h(ColumnLayoutProvider, {width}, [
      h(ClipToFrame, {
        className: 'lithology-column',
        left, shiftY,
        frame: SimpleFrame
      }, children)
    ]);
  }
}
LithologyColumn.initClass();

const simplifiedResolveID = function(d){
  const p = symbolIndex[d.fill_pattern];
  if (p != null) { return p; }
  const fp = d.fill_pattern;
  // Special case for shales since we probably want to emphasize lithology
  if (parseInt(fp) === 624) {
    return defaultResolveID(d);
  } else {
    return fp;
  }
};

const SimplifiedLithologyColumn = props => h(LithologyColumnInner, {
  resolveID: simplifiedResolveID,
  ...props
});

const GeneralizedSectionColumn = function(props){
  let {children, frame, ...rest} = props;
  if (frame == null) { frame = GrainsizeFrame; }
  return h(ClipToFrame, {
    className: 'lithology-column',
    frame,
    ...rest
  }, children);
};

const CarbonateDivisions = props => h(LithologyColumnInner, {
  resolveID: carbonateResolveID,
  ...props
});

export * from './patterns';
export {ParameterIntervals,
        LithologyColumn,
        LithologyBoxes,
        GeneralizedSectionColumn,
        defaultResolveID,
        FaciesColumnInner,
        LithologySymbolDefs,
        LithologyColumnInner,
        CarbonateDivisions,
        SimplifiedLithologyColumn,
        CoveredOverlay,
        SimpleFrame,
        GrainsizeFrame,
        ColumnRect,
        expandDivisionsByKey,
        symbolIndex};
