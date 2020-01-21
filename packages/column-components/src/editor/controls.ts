/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {findDOMNode} from "react-dom";
import {Component, createElement} from "react";
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core";
import {DeleteButton} from '@macrostrat/ui-components';
import Select from 'react-select';
import {format} from "d3-format";

import {FaciesDescriptionSmall, FaciesCard} from "./facies";
import {PickerControl} from "./picker-base";
import {FaciesContext, ColumnContext} from "../context";

import {LithologyPicker, LithologySymbolPicker, FillPatternControl} from './lithology-picker';
import {FaciesPicker} from './facies/picker';
import {grainSizes} from "../grainsize";
import h from "react-hyperscript";
import styles from "./main.styl";
import T from 'prop-types';
import {IntervalShape} from './types';

const fmt = format('.1f');

const surfaceTypes = [
  {value: 'mfs', label: 'Maximum flooding surface'},
  {value: 'sb', label: 'Sequence boundary'}
];

const SurfaceOrderSlider = function(props){
  const {interval, onChange} = props;
  if ((interval.surface_type == null)) {
    return h('p', 'Please set an interval type to access surface orders');
  }
  let val = interval.surface_order;
  if (val == null) { val = 5; }
  return h(Slider, {
    min: 0,
    max: 5,
    stepSize: 1,
    showTrackFill: false,
    value: val,
    onChange: surface_order=> {
      if (interval.surface_type == null) { return; }
      return onChange({surface_order});
    }
  });
};

const RaisedSelect = props => h(Select, {
  styles: {
    menu: (provided, state) => ({
      ...provided,
      zIndex: 20
    })
  },
  ...props
});

class CorrelatedSurfaceControl extends Component {
  static initClass() {
    this.contextType = FaciesContext;
  }
  render() {
    const {surfaces} = this.context;
    const {onChange, interval} = this.props;

    const options = surfaces.map(d => ({
      value: d.id,

      label: h("div.correlated-surface-row", [
        h("div.bp3-code", d.id),
        h("div", d.note)
      ])
    }));

    const value = options.find(d => d.value === interval.surface);

    return h(RaisedSelect, {
      options,
      isClearable: true,
      isSearchable: true,
      name: "selected-state",
      value,
      onChange: surface=> {
        if (surface != null) {
          surface = surface.value;
        }
        return onChange({surface});
      }
    });
  }
}
CorrelatedSurfaceControl.initClass();

const HorizontalPicker = props => h(PickerControl, {
  vertical: false,
  isNullable: true,
  ...props
});

class BoundaryStyleControl extends Component {
  static initClass() {
    this.propTypes = {
      interval: IntervalShape
    };
  }
  render() {
    const {interval, onUpdate} = this.props;
    const states = [
        {label: "Abrupt", value: true},
        {label: "Diffuse", value: false}
      ];

    return h(HorizontalPicker, {
      states,
      activeState: interval.definite_boundary,
      onUpdate
    });
  }
}
BoundaryStyleControl.initClass();

export {
  SurfaceOrderSlider,
  BoundaryStyleControl,
  HorizontalPicker,
  CorrelatedSurfaceControl,
  RaisedSelect
};
