import { Component } from "react";
import h from "@macrostrat/hyper";
import Swatch from "@uiw/react-color-swatch";
import { Popover } from "@blueprintjs/core";
import { FaciesContext } from "../../context";

interface FaciesColorPickerProps {
  facies: {
    id: number;
    color: string;
  };
}

class FaciesColorPicker extends Component<FaciesColorPickerProps> {
  static contextType = FaciesContext;
  declare context: any;

  render() {
    const { setFaciesColor } = this.context;
    const { facies: d } = this.props;
    return h("div", [
      h(Swatch, {
        color: d.color || "black",
        onChange(color) {
          return setFaciesColor(d.id, color.hex);
        },
      }),
    ]);
  }
}

const BasicFaciesSwatch = ({ facies: d, ...rest }) =>
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

class FaciesSwatch extends Component<FaciesSwatchProps> {
  static defaultProps = {
    isEditable: true,
    facies: null,
  };
  constructor(props) {
    super(props);
  }

  render() {
    const { facies, isEditable } = this.props;
    const basic = h(BasicFaciesSwatch, { facies });
    if (!isEditable) {
      return basic;
    }
    return h(
      Popover,
      {
        // tetherOptions: {
        //   constraints: [{ attachment: "together", to: "scrollParent" }],
        // },
      },
      [basic, h(FaciesColorPicker, { facies })],
    );
  }
}

export { FaciesSwatch, BasicFaciesSwatch };
