import { Component } from "react";
import { hyperStyled } from "@macrostrat/hyper";
import { ColumnDivision, FaciesContext } from "../../context";
import { BasicFaciesSwatch } from "./color-picker";
import { RaisedSelect } from "../util";
import styles from "../main.module.scss";

const h = hyperStyled(styles);

const FaciesRow = ({ facies }) =>
  h("span.facies-picker-row", [
    h(BasicFaciesSwatch, { facies, className: "facies-color-swatch" }),
    h("span.facies-picker-name", facies.name),
  ]);

interface FaciesPickerProps {
  interval: ColumnDivision;
  onChange: (f: number) => void;
}

export class FaciesPicker extends Component<FaciesPickerProps> {
  static contextType = FaciesContext;
  context: any;
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
