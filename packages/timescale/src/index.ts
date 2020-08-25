import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { TimescaleProvider } from "./provider";
import { Interval, TimescaleOrientation } from "./types";
import { TimescaleBoxes } from "./components";
import { nestTimescale } from "./preprocess";
import { AgeAxis } from "./age-axis";
import classNames from "classnames";
import "./main.styl";

interface TimescaleProps {
  intervals?: Interval[];
  orientation: TimescaleOrientation;
  levels: number[] | null;
  length?: number;
  ageRange?: [number, number];
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
  const { intervals, orientation, ageRange, length, absoluteAgeScale } = props;

  const [parentMap, timescale] = nestTimescale(0, intervals);

  const className = classNames(orientation);
  const length = absoluteAgeScale ? 6000 : null;

  return h(
    TimescaleProvider,
    {
      timescale,
      selectedInterval: null,
      parentMap,
      ageRange: [timescale.lag, timescale.eag],
      length,
      orientation,
    },
    h("div.timescale", { className }, [
      h(TimescaleBoxes, { interval: timescale }),
      h(AgeAxis),
    ])
  );
}

Timescale.defaultProps = {
  intervals: defaultIntervals,
  orientation: TimescaleOrientation.HORIZONTAL,
};

export { Timescale, TimescaleOrientation, TimescaleProps };
