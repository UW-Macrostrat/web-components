import { scaleLinear, scaleOrdinal } from "d3-scale";
import { Component, createContext } from "react";
import h from "@macrostrat/hyper";
import {
  ColumnContext,
  useColumnDivisions,
  ColumnCtx,
  ColumnDivision,
} from "./column";
import { useContext, useMemo, useCallback } from "react";
import { ReactNode } from "react";

//# This isn't really used yet...

export interface ColumnLayoutCtx<T extends ColumnDivision>
  extends ColumnCtx<T> {
  width: number;
  grainSizes?: string[];
  grainsizeScale?: (d: string) => number;
  xScale: any;
  widthForDivision: (d: ColumnDivision) => number;
}

const ColumnLayoutContext = createContext<ColumnLayoutCtx<ColumnDivision>>({
  scale: scaleLinear(),
  scaleClamped: scaleLinear().clamp(true),
  width: 0,
  divisions: [],
  grainSizes: [],
  grainsizeScale: (d) => 40,
  xScale: null,
  widthForDivision: (d) => 0,
  pixelsPerMeter: 1,
  zoom: 1,
});

export interface ColumnLayoutProviderProps<T extends ColumnDivision>
  extends Partial<ColumnCtx<T>> {
  grainSizes?: string[];
  grainsizeScale?: (d: string) => number;
  width: number;
  // @deprecated
  xScale?: any;
  children?: ReactNode;
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
        widthForDivision: (d) => width,
      },
    },
    children
  );
}

interface CrossAxisLayoutProviderProps {
  width: number;
  domain: number[];
  range?: number[];
  children?: ReactNode;
}

class CrossAxisLayoutProvider extends Component<CrossAxisLayoutProviderProps> {
  static contextType = ColumnContext;
  context: ColumnCtx<ColumnDivision>;
  render() {
    let { domain, range, width, children } = this.props;
    if (range == null) {
      range = [0, width];
    }
    const xScale = scaleLinear().domain(domain).range(range);
    return h(ColumnLayoutProvider, {
      ...this.context,
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

  const grainsizeScale: any = useMemo(() => {
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
    } as any,
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
