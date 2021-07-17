/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component } from "react";
import h from "./hyper";
import { ColumnContext } from "./context";

class ColumnImage extends Component {
  static initClass() {
    this.contextType = ColumnContext;
  }
  render() {
    const { src, ...rest } = this.props;
    const { pixelHeight } = this.context;
    return h("div.column-image", { style: rest }, [
      h("img", { src, style: { height: pixelHeight } })
    ]);
  }
}
ColumnImage.initClass();

export { ColumnImage };
