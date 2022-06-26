/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { Component, createContext } from "react";
import h from "react-hyperscript";
import T from "prop-types";
import { ColumnContext, useColumnDivisions } from "./column";
import { useContext, useMemo, useCallback } from "react";

//# This isn't really used yet...

const ColumnLayoutContext = createContext({
  scale: null,
  width: 0,
  divisions: [],
});

class ColumnLayoutProvider extends Component {
  static propTypes = {
    width: T.number.isRequired,
  };
  static contextType = ColumnContext;
  render() {
    const { children, ...rest } = this.props;
    const value = { ...this.context, ...rest };
    return h(ColumnLayoutContext.Provider, { value }, children);
  }
}

class CrossAxisLayoutProvider extends Component {
  static propTypes = {
    width: T.number.isRequired,
    domain: T.arrayOf(T.number).isRequired,
    range: T.arrayOf(T.number),
  };
  static contextType = ColumnContext;
  render() {
    let { domain, range, width, children } = this.props;
    if (range == null) {
      range = [0, width];
    }
    const xScale = scaleLinear().domain(domain).range(range);
    return h(ColumnLayoutProvider, {
      xScale,
      width,
      children,
    });
  }
}

function GrainsizeLayoutProvider({
  width,
  grainSizes = ["ms", "s", "vf", "f", "m", "c", "vc", "p"],
  grainsizeScaleStart = 50,
  children,
}) {
  /**
  Right now this provides a ColumnLayoutContext
  but it could be reworked to provide a
  separate "GrainsizeLayoutContext" if that seemed
  appropriate.
  */

  const grainsizeScaleRange = [grainsizeScaleStart, width];
  const divisions = useColumnDivisions();

  const scale = scaleLinear()
    .domain([0, grainSizes.length - 1])
    .range([grainsizeScaleStart, width]);
  const grainsizeScale = useMemo(() => {
    return scaleOrdinal()
      .domain(grainSizes)
      .range(grainSizes.map((d, i) => scale(i)));
  }, [grainSizes, scale]);

  // This function should probably be moved up a level
  const grainsizeForDivision = useCallback(
    (division) => {
      let ix = divisions.indexOf(division);
      // Search backwards through divisions
      while (ix > 0) {
        const { grainsize } = divisions[ix];
        if (grainsize != null) {
          return grainsize;
        }
        ix -= 1;
      }
    },
    [divisions]
  );

  const widthForDivision = useCallback(
    (division) => {
      if (division == null) {
        return width;
      }
      return grainsizeScale(grainsizeForDivision(division));
    },
    [grainsizeForDivision, grainsizeScale, width]
  );

  // This is slow to run each iteration
  return h(
    ColumnLayoutProvider,
    {
      width,
      grainSizes,
      grainsizeScale,
      grainsizeScaleStart,
      grainsizeScaleRange,
      grainsizeForDivision,
      widthForDivision,
    },
    children
  );
}

const useColumnLayout = () => useContext(ColumnLayoutContext);

export {
  ColumnLayoutContext,
  ColumnLayoutProvider,
  CrossAxisLayoutProvider,
  GrainsizeLayoutProvider,
  useColumnLayout,
};
