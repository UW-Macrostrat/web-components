import { defaultIntervals } from "./intervals";
import { TimescaleProvider, useTimescale } from "./provider";
import { Interval, TimescaleOrientation } from "./types";
import {
  TimescaleBoxes,
  Cursor,
  IntervalStyleBuilder,
  LabelProps,
} from "./components";
import { nestTimescale } from "./preprocess";
import { AgeAxis, AgeAxisProps } from "./age-axis";
import classNames from "classnames";
import { ScaleContinuousNumeric } from "d3-scale";
import { useEffect, useMemo } from "react";
import h from "./hyper";

type ClickHandler = (event: Event, interval: any) => void;

export enum IncreaseDirection {
  UP_RIGHT = "up-right",
  DOWN_LEFT = "down-left",
}
interface TimescaleProps {
  intervals?: Interval[];
  orientation?: TimescaleOrientation;
  increaseDirection?: IncreaseDirection;
  levels?: [number, number] | null;
  length?: number;
  ageRange?: [number, number];
  absoluteAgeScale?: boolean;
  showAgeAxis?: boolean;
  rootInterval?: number;
  /** Configuration for the axis */
  axisProps?: Partial<AgeAxisProps>;
  labelProps?: LabelProps;
  onClick?: ClickHandler;
  cursorPosition?: number | null;
  cursorComponent?: any;
  intervalStyle?: IntervalStyleBuilder;
  scale?: ScaleContinuousNumeric<number, number>;
}

function TimescaleContainer(props: {
  onClick?: ClickHandler;
  className: string;
  children?: React.ReactNode;
}) {
  const { onClick: clickHandler, ...rest } = props;
  const { scale, orientation } = useTimescale();

  function onClick(evt) {
    const bbox = evt.currentTarget.getBoundingClientRect();
    const pos =
      orientation == TimescaleOrientation.HORIZONTAL
        ? evt.clientX - bbox.x
        : evt.clientY - bbox.y;
    clickHandler(evt, scale.invert(pos));
  }

  return h("div.timescale.timescale-container", { onClick, ...rest });
}

function Timescale(props: TimescaleProps) {
  /**
   * A geologic timescale component for react.
   *
   * @remarks
   * Nothing yet.
   *
   * @param intervals - Intervals
   * @param width - Width of the timescale (optional)
   *
   */
  const {
    intervals = defaultIntervals,
    orientation = TimescaleOrientation.HORIZONTAL,
    ageRange,
    length: l,
    showAgeAxis = true,
    levels,
    scale,
    rootInterval = 0,
    axisProps = {},
    cursorPosition,
    cursorComponent = Cursor,
    onClick = null,
    intervalStyle,
    increaseDirection = IncreaseDirection.DOWN_LEFT,
    labelProps,
  } = props;

  const [parentMap, timescale] = useMemo(
    () => nestTimescale(rootInterval, intervals),
    [rootInterval, intervals],
  );

  const className = classNames(orientation, "increase-" + increaseDirection);

  return h(
    TimescaleProvider,
    {
      timescale,
      selectedInterval: null,
      parentMap,
      ageRange: ageRange,
      length: l,
      orientation,
      levels,
      scale,
      increaseDirection,
    },
    h(TimescaleContainer, { className }, [
      h(TimescaleBoxes, {
        interval: timescale,
        intervalStyle,
        onClick,
        labelProps,
      }),
      h.if(showAgeAxis)(AgeAxis, axisProps),
      h.if(cursorPosition != null)(cursorComponent, { age: cursorPosition }),
    ]),
  );
}

export {
  Timescale,
  TimescaleOrientation,
  TimescaleProps,
  defaultIntervals as intervals,
};
