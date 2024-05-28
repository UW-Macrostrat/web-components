import { scaleLinear, scaleOrdinal } from "d3-scale";
import { Component, createContext } from "react";
import h from "@macrostrat/hyper";
import T from "prop-types";
import { ColumnContext, useColumnDivisions } from "./column";
import { useContext, useMemo, useCallback } from "react";
import { ColumnCtx } from "./column";
import { ColumnDivision } from "../defs";

//# This isn't really used yet...

const ColumnLayoutContext = createContext({
  scale: null,
  width: 0,
  divisions: [],
  grainSizes: [],
  grainsizeScale: (d) => 40,
  xScale: null,
});

interface ColumnLayoutProviderProps<T extends ColumnDivision>
  extends ColumnCtx<T> {
  grainSizes: string[];
  grainsizeScale: any;
  width: number;
  // @deprecated
  xScale: any;
}

function ColumnLayoutProvider<T extends ColumnDivision>({
  children,
  width,
  grainSizes = [],
  grainsizeScale = (d) => 40,
  xScale,
}: ColumnLayoutProviderProps<T>) {
  const ctx = useContext(ColumnContext);
  return h(
    ColumnLayoutContext.Provider,
    {
      value: {
        ...ctx,
        width,
        grainSizes,
        grainsizeScale,
        xScale,
      },
    },
    children
  );
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

export type GrainsizeLayoutProps = {
  grainSizes: string[];
  children?: React.ReactNode;
  width?: number;
  grainsizeScaleStart?: number;
  grainsizeScaleRange?: [number, number];
  tickPositions?: number[];
};

function GrainsizeLayoutProvider({
  width,
  grainSizes = ["ms", "s", "vf", "f", "m", "c", "vc", "p"],
  grainsizeScaleStart = 50,
  grainsizeScaleRange,
  tickPositions,
  children,
}: GrainsizeLayoutProps) {
  /**
  Right now this provides a ColumnLayoutContext
  but it could be reworked to provide a
  separate "GrainsizeLayoutContext" if that seemed
  appropriate.
  */

  if (grainsizeScaleRange == null) {
    console.warn(
      "GrainsizeLayoutProvider: grainsizeScaleStart and width are deprecated in favor of grainsizeScaleRange"
    );
  }

  grainsizeScaleRange ??= [grainsizeScaleStart, width];
  const divisions = useColumnDivisions();

  const grainsizeScale = useMemo(() => {
    const scale = scaleLinear()
      .domain([0, grainSizes.length - 1])
      .range(grainsizeScaleRange);

    tickPositions ??= grainSizes.map((d, i) => scale(i));

    return scaleOrdinal().domain(grainSizes).range(tickPositions);
  }, [grainSizes, grainsizeScaleRange, tickPositions]);

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
