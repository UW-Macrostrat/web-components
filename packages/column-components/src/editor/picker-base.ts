/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from "@macrostrat/hyper";
import classNames from "classnames";
import { Component } from "react";

interface PickerControlProps {
  states: { label: string; value: string }[];
  activeState: string;
  vertical: boolean;
  isNullable: boolean;
  onUpdate: (value: string) => void;
}

export class PickerControl extends Component<PickerControlProps> {
  constructor(props) {
    super(props);
    this.onUpdate = this.onUpdate.bind(this);
  }

  static defaultProps = {
    states: [
      { label: "State 1", value: "state1" },
      { label: "State 2", value: "state2" },
    ],
    vertical: true,
    isNullable: false,
  };

  render() {
    const { states, activeState, vertical } = this.props;
    let className = classNames("bp5-button-group", "bp5-fill", {
      "bp5-vertical": vertical,
      "bp5-align-left": vertical,
    });

    return h("div.picker-control", [
      h(
        "div",
        { className },
        states.map((d) => {
          className = classNames("bp5-button", {
            "bp5-active": this.props.activeState === d.value,
          });
          return h(
            "button",
            {
              type: "button",
              className,
              onClick: this.onUpdate(d.value),
            },
            d.label,
          );
        }),
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
