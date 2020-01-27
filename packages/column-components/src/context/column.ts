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

const ColumnContext = createContext({
  scale: scaleLinear([0,1]),
  divisions: []
});

const rangeOrHeight = function(props, propName){
  const {range, height} = props;
  const rangeExists = (range != null) && (range.length === 2);
  const heightExists = (height != null);
  if (rangeExists || heightExists) { return; }
  return new Error("Provide either 'range' or 'height' props");
};

class ColumnProvider extends Component {
  static initClass() {
    /*
    Lays out a column on its Y (height) axis.
    This component would be swapped to provide eventual generalization to a Wheeler-diagram
    (time-domain) framework.
    */
    this.propTypes = {
      divisions: T.arrayOf(T.object),
      range: rangeOrHeight,
      height: rangeOrHeight,
      pixelsPerMeter: T.number.isRequired,
      zoom: T.number
    };
    this.defaultProps = {
      divisions: [],
      width: 150,
      pixelsPerMeter: 20,
      zoom: 1
    };
  }

  render() {
    let {children,
     pixelsPerMeter,
     zoom,
     height,
     range,
     ...rest} = this.props;

    //# Calculate correct range and height
    // Range overrides height if set
    if (range != null) {
      height = Math.abs(range[1]-range[0]);
    } else {
      range = [0, height];
    }

    // same as the old `innerHeight`
    const pixelHeight = height*pixelsPerMeter*zoom;

    const scale = scaleLinear().domain(range).range([pixelHeight, 0]);
    const scaleClamped = scale.copy().clamp(true);

    const value = {
      pixelsPerMeter,
      pixelHeight,
      zoom,
      range,
      height,
      scale,
      scaleClamped,
      ...rest
    };
    return h(ColumnContext.Provider, {value}, children);
  }
}
ColumnProvider.initClass();

export {ColumnContext, ColumnProvider};
