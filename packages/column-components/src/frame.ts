/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createElement, useState} from "react";
import h from "react-hyperscript";
import {path} from "d3-path";
import {ColumnLayoutContext} from "./context";
import T from 'prop-types';
import {v4} from "uuid";

class UUIDComponent extends Component {
  constructor(props){
    super(props);
    this.UUID = v4();
  }
}

const useUUID = () => useState(v4())[0];

class SimpleFrame extends Component {
  static initClass() {
    this.contextType = ColumnLayoutContext;
    this.propTypes = {
      id: T.string.isRequired
    };
  }
  render() {
    const {pixelHeight: height, width} = this.context;
    let {id: frameID} = this.props;
    if (frameID.startsWith("#")) {
      frameID = frameID.slice(1);
    }
    return h("rect", {id: frameID, x:0,y:0,width,height, key: frameID});
  }
}
SimpleFrame.initClass();

class GrainsizeFrame extends Component {
  static initClass() {
    this.contextType = ColumnLayoutContext;
  }
  render() {
    let div;
    const {scale, divisions, grainsizeScale: gs} = this.context;
    if ((gs == null)) {
      throw "GrainsizeFrame must be a child of a GrainsizeScaleProvider";
    }
    let {id: frameID} = this.props;
    if (frameID.startsWith("#")) {
      frameID = frameID.slice(1);
    }
    if (divisions.length === 0) {
      return null;
    }

    const [bottomOfSection, topOfSection] = scale.domain();

    const topOf = function(d){
      let {top} = d;
      if (top > topOfSection) {
        top = topOfSection;
      }
      return scale(top);
    };
    const bottomOf = function(d){
      let {bottom} = d;
      if (bottom < bottomOfSection) {
        bottom = bottomOfSection;
      }
      return scale(bottom);
    };

    const filteredDivisions = divisions.filter(function(d){
      if (d.top <= bottomOfSection) { return false; }
      if (d.bottom > topOfSection) { return false; }
      return true;
    });

    let _ = null;
    let currentGrainsize = 'm';
    for (div of Array.from(filteredDivisions)) {
      if ((_ == null)) {
        _ = path();
        _.moveTo(0,bottomOf(div));
      }
      if (div.grainsize != null) {
        currentGrainsize = div.grainsize;
      }
      const x = gs(currentGrainsize);
      _.lineTo(x, bottomOf(div));
      _.lineTo(x, topOf(div));
    }
    _.lineTo(0, topOf(div));
    _.closePath();

    return h("path", {id: frameID, key: frameID, d: _.toString()});
  }
}
GrainsizeFrame.initClass();

const ClipPath = function(props){
  let {id, children, ...rest} = props;
  if (id.startsWith('#')) {
    id = id.slice(1);
  }
  return createElement('clipPath', {id, key: id, ...rest}, children);
};

const UseFrame = function(props){
  const {id: frameID, ...rest} = props;
  return h('use.frame', {xlinkHref: frameID, fill:'transparent', key: 'frame', ...rest});
};

const prefixID = function(uuid, prefixes){
  const res = {};
  for (let prefix of Array.from(prefixes)) {
    res[prefix+"ID"] = `#${uuid}-${prefix}`;
  }
  return res;
};

const widthOrFrame = function(props, propName){
  const {width, frame} = props;
  const widthExists = (width != null);
  const frameExists = (frame != null);
  if (widthExists || frameExists) { return; }
  return new Error("Provide either 'width' or 'frame' props");
};

class ClipToFrame extends UUIDComponent {
  constructor(...args) {
    this.computeTransform = this.computeTransform.bind(this);
    super(...args);
  }

  static initClass() {
    this.defaultProps = {
      onClick: null,
      shiftY: 0
    };
    this.propTypes = {
      left: T.number,
      shiftY: T.number,
      onClick: T.func,
      frame: widthOrFrame,
      width: widthOrFrame
    };
  }
  computeTransform() {
    const {left, shiftY} = this.props;
    if (left == null) { return null; }
    return `translate(${left} ${shiftY})`;
  }
  render() {
    let {children, frame, className, onClick} = this.props;
    if ((frame == null)) {
      const {width} = this.props;
      frame = props=> h(SimpleFrame, {width, ...props});
    }

    const transform = this.computeTransform();
    const {frameID, clipID} = prefixID(this.UUID, ["frame", "clip"]);

    return h('g', {className, transform, onClick},[
      h('defs', {key: 'defs'}, [
        h(frame, {id: frameID}),
        h(ClipPath, {id: clipID}, h(UseFrame, {id: frameID}))
      ]),
      h('g.inner', {
        clipPath: `url(${clipID})`
      }, children),
      h(UseFrame, {id: frameID})
    ]);
  }
}
ClipToFrame.initClass();

export {
  SimpleFrame,
  GrainsizeFrame,
  ClipPath,
  UUIDComponent,
  ClipToFrame,
  useUUID
};
