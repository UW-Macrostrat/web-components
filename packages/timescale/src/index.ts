import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { TimescaleProvider } from "./provider";
import { Interval, TimescaleOrientation } from "./types";
import { TimescaleBoxes } from "./components";
import { nestTimescale } from "./preprocess";
import { AgeAxis, AgeAxisProps } from "./age-axis";
import classNames from "classnames";
import "./main.styl";

interface TimescaleProps {
  intervals?: Interval[];
  orientation?: TimescaleOrientation;
  levels?: [number, number] | null;
  length?: number;
  ageRange?: [number, number];
  absoluteAgeScale?: boolean;
  rootInterval?: number;
  /** Configuration for the axis */
  axisProps?: AgeAxisProps;
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
    levels,
    rootInterval,
    axisProps,
  } = props;

  const [parentMap, timescale] = nestTimescale(rootInterval, intervals);

  const className = classNames(orientation);
  const length = absoluteAgeScale ? l ?? 6000 : null;

  let ageRange2 = ageRange ?? [timescale.eag, timescale.lag];
  if (orientation == TimescaleOrientation.VERTICAL) {
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
    h("div.timescale", { className }, [
      h(TimescaleBoxes, { interval: timescale }),
      h(AgeAxis, axisProps),
    ])
  );
}

Timescale.defaultProps = {
  intervals: defaultIntervals,
  orientation: TimescaleOrientation.HORIZONTAL,
  rootInterval: 0,
  axisProps: {},
};

export {
  Timescale,
  TimescaleOrientation,
  TimescaleProps,
  defaultIntervals as intervals,
};
