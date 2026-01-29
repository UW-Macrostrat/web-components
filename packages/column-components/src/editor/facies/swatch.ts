import { Component } from "react";
import { hyperStyled } from "@macrostrat/hyper";
import { ColumnDivision, FaciesContext } from "../../context";
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
  declare context: any;

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

//import { Swatch } from "@uiw/react-color";
//import { Popover } from "@blueprintjs/core";
//import { FaciesContext } from "../../context";

interface FaciesColorPickerProps {
  facies: {
    id: number;
    color: string;
  };
}

// class FaciesColorPicker extends Component<FaciesColorPickerProps> {
//   static contextType = FaciesContext;
//   declare context: any;
//
//   render() {
//     const { setFaciesColor } = this.context;
//     const { facies: d } = this.props;
//     return h("div", [
//       h(Swatch, {
//         color: d.color || "black",
//         onChange(color) {
//           return setFaciesColor(d.id, color.hex);
//         },
//       }),
//     ]);
//   }
// }

export const BasicFaciesSwatch = ({ facies: d, ...rest }) =>
  h("div.color-swatch", {
    style: {
      backgroundColor: d.color || "black",
      width: "2em",
      height: "2em",
    },
    ...rest,
  });

interface FaciesSwatchProps {
  isEditable: boolean;
  facies: {
    id: number;
    color: string;
  } | null;
}

export class FaciesSwatch extends Component<FaciesSwatchProps> {
  static defaultProps = {
    isEditable: true,
    facies: null,
  };
  constructor(props) {
    super(props);
  }

  render() {
    const { facies, isEditable = false } = this.props;
    const basic = h(BasicFaciesSwatch, { facies });
    return basic;
    // return h(
    //   Popover,
    //   {
    //     // tetherOptions: {
    //     //   constraints: [{ attachment: "together", to: "scrollParent" }],
    //     // },
    //   },
    //   [basic, h(FaciesColorPicker, { facies })],
    // );
  }
}
