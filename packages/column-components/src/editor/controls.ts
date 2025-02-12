import { Component } from "react";
import { Slider } from "@blueprintjs/core";

import { PickerControl } from "./picker-base";
import { ColumnDivision } from "../context";

import h from "@macrostrat/hyper";

const surfaceTypes = [
  { value: "mfs", label: "Maximum flooding surface" },
  { value: "sb", label: "Sequence boundary" },
];

export function SurfaceOrderSlider(props) {
  const { interval, onChange } = props;
  //if not interval.surface_type?
  //  return h 'p', 'Please set an surface type to access orders'
  let val = interval.surface_order;
  if (val == null) {
    val = 5;
  }
  return h(Slider, {
    min: 0,
    max: 5,
    disabled: interval.surface_type == null,
    stepSize: 1,
    showTrackFill: false,
    value: val,
    onChange: (surface_order) => {
      if (interval.surface_type == null) {
        return;
      }
      return onChange({ surface_order });
    },
  });
}

export function HorizontalPicker(props) {
  return h(PickerControl, {
    vertical: false,
    isNullable: true,
    ...props,
  });
}

interface BoundaryStyleProps {
  interval: ColumnDivision;
  onUpdate: (d: any) => void;
}

export class BoundaryStyleControl extends Component<BoundaryStyleProps> {
  render() {
    const { interval, onUpdate } = this.props;
    const states = [
      { label: "Abrupt", value: true },
      { label: "Diffuse", value: false },
    ];

    return h(HorizontalPicker, {
      states,
      activeState: interval.definite_boundary,
      onUpdate,
    });
  }
}
