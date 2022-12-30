/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component } from "react";
import h from "react-hyperscript";
import T from "prop-types";
import classNames from "classnames";
import { FaciesContext } from "../../context";
import { FaciesSwatch } from "./color-picker";

const FaciesCard = ({ facies }) =>
  h("div.header", [
    h("p.name", { style: { marginRight: 20, textAlign: "left" } }, facies.name),
    h(FaciesSwatch, { facies })
  ]);

class FaciesDescriptionSmall extends Component {
  constructor(...args) {
    super(...args);
    this.renderEach = this.renderEach.bind(this);
  }

  static initClass() {
    this.contextType = FaciesContext;
    this.defaultProps = { selected: null, isEditable: false };
  }
  renderEach(d) {
    let onClick = null;
    const style = {};
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
        className
      },
      h(FaciesCard, { facies: d })
    );
  }

  render() {
    const { facies } = this.context;
    return h("div.facies-description-small", [
      h("h5", "Facies"),
      h("div", facies.map(this.renderEach))
    ]);
  }
}
FaciesDescriptionSmall.initClass();

export { FaciesDescriptionSmall };
