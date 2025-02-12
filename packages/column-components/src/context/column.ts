import { scaleLinear, ScaleContinuousNumeric, ScaleLinear } from "d3-scale";
import React, { createContext, useContext, useMemo } from "react";
import h from "@macrostrat/hyper";

type HeightRange = [number, number];
type ColumnScale = ScaleContinuousNumeric<HeightRange, number> | any;

type ColumnScaleClamped = ScaleLinear<number, number>;

export declare interface ColumnDivision {
  section_id: string;
  id: number;
  surface: number;
  bottom: number;
  top: number;
  // Extra properties that are there for legacy purposes
  flooding_surface_order?: number;
  grainsize?: string;
}

enum ColumnAxisType {
  AGE = "age",
  HEIGHT = "height",
  DEPTH = "depth",
}
export interface ColumnCtx<T extends ColumnDivision> {
  divisions: T[];
  scaleClamped: ColumnScaleClamped;
  pixelsPerMeter: number;
  scale: ColumnScale;
  axisType?: ColumnAxisType;
  pixelHeight?: number;
  zoom: number;
}

const ColumnContext = createContext<ColumnCtx<ColumnDivision>>({
  scale: scaleLinear(),
  divisions: [],
  scaleClamped: scaleLinear().clamp(true),
  pixelsPerMeter: 1,
  zoom: 1,
});

const rangeOrHeight = function (props, propName) {
  const { range, height } = props;
  const rangeExists = range != null && range.length === 2;
  const heightExists = height != null;
  if (rangeExists || heightExists) {
    return;
  }
  return new Error("Provide either 'range' or 'height' props");
};

interface ColumnProviderProps<T extends ColumnDivision> {
  pixelsPerMeter?: number;
  divisions: T[];
  range?: HeightRange | any;
  height?: number;
  zoom?: number;
  width?: number;
  axisType?: ColumnAxisType;
  children?: any;
}

function ColumnProvider<T extends ColumnDivision>(
  props: ColumnProviderProps<T>
) {
  /**
    Lays out a column on its Y (height) axis.
    This component would be swapped to provide eventual generalization to a Wheeler-diagram
    (time-domain) framework.
    */

  let {
    children,
    pixelsPerMeter = 20,
    zoom = 1,
    height,
    range,
    divisions = [],
    width = 150,
    axisType = ColumnAxisType.HEIGHT,
    ...rest
  } = props;

  // Check if "rest" actually changed
  // This is a hack to avoid re-rendering the column
  // when the "rest" props change
  const restStr = JSON.stringify(rest);
  const restRef = React.useRef(null);
  if (restStr !== restRef.current) {
    restRef.current = restStr;
    if (Object.keys(rest).length > 0) {
      console.warn(
        "Passing extra properties to ColumnProvider is deprecated:",
        rest
      );
    }
  }

  //# Calculate correct range and height
  // Range overrides height if set
  const value: ColumnCtx<T> = useMemo(() => {
    if (range != null) {
      height = Math.abs(range[1] - range[0]);
    } else {
      range = [0, height];
    }

    // same as the old `innerHeight`
    const pixelHeight = height * pixelsPerMeter * zoom;

    const scale = scaleLinear().domain(range).range([pixelHeight, 0]);
    const scaleClamped = scale.copy().clamp(true);

    return {
      pixelsPerMeter,
      pixelHeight,
      zoom,
      range,
      height,
      scale,
      scaleClamped,
      divisions,
      width,
      axisType,
      ...rest,
    };
  }, [
    axisType,
    height,
    pixelsPerMeter,
    range,
    zoom,
    divisions,
    width,
    restRef.current,
  ]);
  return h(ColumnContext.Provider, { value }, children);
}

const useColumn = () => useContext(ColumnContext);
const useColumnDivisions = () => useContext(ColumnContext).divisions;

export {
  ColumnContext,
  ColumnProvider,
  ColumnAxisType,
  useColumnDivisions,
  useColumn,
};
