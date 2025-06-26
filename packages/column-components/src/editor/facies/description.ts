import { Component } from "react";
import h from "@macrostrat/hyper";
import classNames from "classnames";
import { FaciesContext } from "../../context";
import { FaciesSwatch } from "./color-picker";

type FaciesData = any;

export const FaciesCard = ({ facies }) =>
  h("div.header", [
    h("p.name", { style: { marginRight: 20, textAlign: "left" } }, facies.name),
    h(FaciesSwatch, { facies }),
  ]);

interface FaciesDescriptionSmallProps {
  selected: string;
  onClick: (d: any) => void;
  isEditable: boolean;
}

export class FaciesDescriptionSmall extends Component<FaciesDescriptionSmallProps> {
  constructor(props: FaciesDescriptionSmallProps) {
    super(props);
    this.renderEach = this.renderEach.bind(this);
  }

  static contextType = FaciesContext;
  static defaultProps = { selected: null, isEditable: false };

  context: any;

  renderEach(d: FaciesData) {
    let onClick = null;
    const style: any = {};
    if (this.props.onClick != null) {
      onClick = () => this.props.onClick(d);
      style.cursor = "pointer";
    }
    const { selected } = this.props;
    if (selected === d.id) {
      style.backgroundColor = d.color;
      style.color = "white";
    }
    const className = classNames({ selected: selected === d.id });

    return h(
      "div.facies.bp3-card.bp3-elevation-0",
      {
        key: d.id,
        onClick,
        style,
        className,
      },
      h(FaciesCard, { facies: d }),
    );
  }

  render() {
    const { facies } = this.context;
    return h("div.facies-description-small", [
      h("h5", "Facies"),
      h("div", facies.map(this.renderEach)),
    ]);
  }
}
