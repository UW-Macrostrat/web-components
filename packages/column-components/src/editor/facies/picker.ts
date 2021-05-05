/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component } from "react";
import { hyperStyled } from "@macrostrat/hyper";
import { FaciesContext } from "../../context";
import { BasicFaciesSwatch } from "./color-picker";
import { RaisedSelect } from "../util";
import styles from "../main.styl";

const h = hyperStyled(styles);

const FaciesRow = ({ facies }) =>
  h("span.facies-picker-row", [
    h(BasicFaciesSwatch, { facies, className: "facies-color-swatch" }),
    h("span.facies-picker-name", facies.name),
  ]);

class FaciesPicker extends Component {
  static initClass() {
    this.contextType = FaciesContext;
  }
  render() {
    const { facies } = this.context;
    const { interval, onChange } = this.props;

    const options = facies.map((f) => ({
      value: f.id,
      label: h(FaciesRow, { facies: f }),
    }));

    let value = options.find((d) => d.value === interval.facies);
    if (value == null) {
      value = null;
    }

    return h(RaisedSelect, {
      id: "facies-select",
      options,
      value,
      selected: interval.facies,
      isClearable: true,
      onChange(res) {
        console.log("Changing", res);
        const f = res != null ? res.value : null;
        return onChange(f);
      },
    });
  }
}
FaciesPicker.initClass();

export { FaciesPicker };
