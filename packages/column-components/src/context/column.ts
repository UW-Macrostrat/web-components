import {
  scaleLinear,
  ScaleContinuousNumeric,
  scaleUtc,
  ScaleLinear
} from "d3-scale";
import React, { Component, createContext, useContext } from "react";
import h from "react-hyperscript";
import T from "prop-types";

type HeightRange = [number, number];
type ColumnScale = ScaleContinuousNumeric<HeightRange, number>;

type ColumnScaleClamped = ScaleLinear<number, number>;

declare interface ColumnDivision {
  section_id: string;
  id: number;
  surface: number;
  bottom: number;
  top: number;
}

interface ColumnCtx<T extends ColumnDivision> {
  divisions: T[];
  scaleClamped: ColumnScaleClamped;
  pixelsPerMeter: number;
  scale: ColumnScale;
  zoom: number;
}

const ColumnContext = createContext<ColumnCtx<ColumnDivision>>({
  scale: scaleLinear(),
  divisions: [],
  scaleClamped: scaleLinear().clamp(true),
  pixelsPerMeter: 1,
  zoom: 1
});

const rangeOrHeight = function(props, propName) {
  const { range, height } = props;
  const rangeExists = range != null && range.length === 2;
  const heightExists = height != null;
  if (rangeExists || heightExists) {
    return;
  }
  return new Error("Provide either 'range' or 'height' props");
};

enum ColumnAxisType {
  Age = "age",
  Height = "height"
}

interface ColumnProviderProps<T extends ColumnDivision> {
  pixelsPerMeter?: number;
  divisions: T;
  range?: HeightRange;
  height?: number;
  zoom?: number;
  width?: number;
  type?: ColumnAxisType;
  children?: React.ReactChild;
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
    type = ColumnAxisType.Height,
    ...rest
  } = props;

  //# Calculate correct range and height
  // Range overrides height if set
  if (range != null) {
    height = Math.abs(range[1] - range[0]);
  } else {
    range = [0, height];
  }

  // same as the old `innerHeight`
  const pixelHeight = height * pixelsPerMeter * zoom;

  const scale = scaleLinear()
    .domain(range)
    .range([pixelHeight, 0]);
  const scaleClamped = scale.copy().clamp(true);

  const value: ColumnCtx<T> = {
    pixelsPerMeter,
    pixelHeight,
    zoom,
    range,
    height,
    scale,
    scaleClamped,
    divisions,
    width,
    ...rest
  };
  return h(ColumnContext.Provider, { value }, children);
}

ColumnProvider.propTypes = {
  divisions: T.arrayOf(T.object),
  range: rangeOrHeight,
  height: rangeOrHeight,
  pixelsPerMeter: T.number.isRequired,
  zoom: T.number
};

const useColumn = () => useContext(ColumnContext);
const useColumnDivisions = () => useContext(ColumnContext).divisions;

export { ColumnContext, ColumnProvider, useColumnDivisions, useColumn };
