import { defaultIntervals } from "./intervals";
import { TimescaleProvider, useTimescale } from "./provider";
import { Interval, TimescaleOrientation } from "./types";
import { TimescaleBoxes, Cursor, IntervalStyleBuilder } from "./components";
import { nestTimescale } from "./preprocess";
import { AgeAxis, AgeAxisProps } from "./age-axis";
import classNames from "classnames";
import { useMemo } from "react";
import h from "./hyper";

type ClickHandler = (event: Event, age: number) => void;

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
  onClick?: ClickHandler;
  cursorPosition?: number | null;
  cursorComponent?: any;
  intervalStyle?: IntervalStyleBuilder;
}

function TimescaleContainer(props: {
  onClick: ClickHandler;
  className: string;
  children?: React.ReactChildren;
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
    absoluteAgeScale = false,
    showAgeAxis = true,
    levels,
    rootInterval = 0,
    axisProps = {},
    cursorPosition,
    cursorComponent = Cursor,
    onClick = () => {},
    intervalStyle,
    increaseDirection = IncreaseDirection.DOWN_LEFT,
  } = props;

  const [parentMap, timescale] = useMemo(
    () => nestTimescale(rootInterval, intervals),
    [rootInterval, intervals]
  );

  const className = classNames(orientation, "increase-" + increaseDirection);
  const length = absoluteAgeScale ? l ?? 6000 : null;

  let ageRange2 = [...ageRange] ?? [timescale.eag, timescale.lag];
  if (
    orientation == TimescaleOrientation.VERTICAL &&
    increaseDirection == IncreaseDirection.DOWN_LEFT &&
    ageRange2[0] < ageRange2[1]
  ) {
    ageRange2.reverse();
  }

  return h(
    TimescaleProvider,
    {
      timescale,
      selectedInterval: null,
      parentMap,
      ageRange: ageRange2,
      length,
      orientation,
      levels,
    },
    h(TimescaleContainer, { className, onClick }, [
      h(TimescaleBoxes, { interval: timescale, intervalStyle }),
      h.if(showAgeAxis)(AgeAxis, axisProps),
      h.if(cursorPosition != null)(cursorComponent, { age: cursorPosition }),
    ])
  );
}

export {
  Timescale,
  TimescaleOrientation,
  TimescaleProps,
  defaultIntervals as intervals,
};
