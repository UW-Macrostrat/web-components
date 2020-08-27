import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { TimescaleProvider, useTimescale } from "./provider";
import { Interval, TimescaleOrientation } from "./types";
import { TimescaleBoxes, Cursor } from "./components";
import { nestTimescale } from "./preprocess";
import { AgeAxis, AgeAxisProps } from "./age-axis";
import classNames from "classnames";
import "./main.styl";

type ClickHandler = (event: Event, age: number) => void;

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
  onClick?: ClickHandler;
  cursorPosition?: number | null;
  cursorComponent?: any;
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

  return h("div.timescale", { onClick, ...rest });
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
    cursorPosition,
    cursorComponent,
    onClick,
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
    h(TimescaleContainer, { className, onClick }, [
      h(TimescaleBoxes, { interval: timescale }),
      h(AgeAxis, axisProps),
      h.if(cursorPosition != null)(cursorComponent, { age: cursorPosition }),
    ])
  );
}

Timescale.defaultProps = {
  intervals: defaultIntervals,
  orientation: TimescaleOrientation.HORIZONTAL,
  cursorComponent: Cursor,
  rootInterval: 0,
  axisProps: {},
  onClick: () => {},
};

export {
  Timescale,
  TimescaleOrientation,
  TimescaleProps,
  defaultIntervals as intervals,
};
