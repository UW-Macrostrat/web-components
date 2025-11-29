/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component } from "react";
import h from "@macrostrat/hyper";
import { SwatchesPicker } from "react-color";
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
      h(SwatchesPicker, {
        color: d.color || "black",
        onChangeComplete(color) {
          return setFaciesColor(d.id, color.hex);
        },
        styles: {
          width: 500,
          height: 570,
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
