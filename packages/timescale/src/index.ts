import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { TimescaleProvider } from "./provider";
import { Interval } from "./types";
import { TimescaleBoxes } from "./components";
import { nestTimescale } from "./preprocess";
import classNames from "classnames";
import "./main.styl";

enum TimescaleOrientation {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

interface TimescaleProps {
  intervals?: Interval[];
  orientation: TimescaleOrientation;
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
  const { intervals, orientation } = props;

  const [parentMap, timescale] = nestTimescale(0, intervals);

  const className = classNames(orientation);

  return h(
    TimescaleProvider,
    { timescale, selectedInterval: null, parentMap },
    h(
      "div.timescale",
      { className },
      h(TimescaleBoxes, { interval: timescale })
    )
  );
}

Timescale.defaultProps = {
  intervals: defaultIntervals,
  orientation: TimescaleOrientation.HORIZONTAL,
};

export { Timescale, TimescaleOrientation };
