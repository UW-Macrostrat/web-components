/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component } from "react";
import h from "@macrostrat/hyper";
import { Switch, Slider, Button } from "@blueprintjs/core";
import classNames from "classnames";

class PickerControl extends Component {
  constructor(...args) {
    super(...args);
    this.onUpdate = this.onUpdate.bind(this);
  }

  static initClass() {
    this.defaultProps = {
      states: [
        { label: "State 1", value: "state1" },
        { label: "State 2", value: "state2" },
      ],
      vertical: true,
      isNullable: false,
    };
  }
  render() {
    const { states, activeState, vertical } = this.props;
    let className = classNames("bp4-button-group", "bp4-fill", {
      "bp4-vertical": vertical,
      "bp4-align-left": vertical,
    });

    return h("div.picker-control", [
      h(
        "div",
        { className },
        states.map((d) => {
          className = classNames("bp4-button", {
            "bp4-active": this.props.activeState === d.value,
          });
          return h(
            "button",
            {
              type: "button",
              className,
              onClick: this.onUpdate(d.value),
            },
            d.label
          );
        })
      ),
    ]);
  }
  onUpdate(value) {
    return () => {
      if (value === this.props.activeState) {
        if (!this.props.isNullable) {
          return;
        }
        value = null;
      }
      if (this.props.onUpdate == null) {
        return;
      }
      return this.props.onUpdate(value);
    };
  }
}
PickerControl.initClass();

export { PickerControl };
