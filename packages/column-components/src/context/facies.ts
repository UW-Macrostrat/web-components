/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, createContext, ExoticComponent } from "react";
import { StatefulComponent } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";

const FaciesContext = createContext({
  facies: [],
  onColorChanged() {},
});

class FaciesProvider extends StatefulComponent<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      facies: props.initialFacies || [],
      __colorMap: {},
    };
    this.getFaciesColor = this.getFaciesColor.bind(this);
    this.setFaciesColor = this.setFaciesColor.bind(this);
  }

  getFaciesColor(id) {
    const { __colorMap } = this.state;
    return __colorMap[id] || null;
  }

  setFaciesColor(id, color) {
    const ix = this.state.facies.findIndex((d) => d.id === id);
    return this.updateState({ facies: { [ix]: { color: { $set: color } } } });
  }

  render() {
    const { facies } = this.state;
    const { children, ...rest } = this.props;
    const procedures = (() => {
      let getFaciesColor, setFaciesColor;
      return ({ getFaciesColor, setFaciesColor } = this);
    })();
    const value = {
      facies,
      ...procedures,
      ...rest,
    };

    return h(FaciesContext.Provider, { value }, children);
  }
}

export { FaciesContext, FaciesProvider };
