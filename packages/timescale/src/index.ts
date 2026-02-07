import { defaultIntervals } from "./intervals";
import { TimescaleProvider, useTimescale } from "./provider";
import {
  Interval,
  TimescaleOrientation,
  IncreaseDirection,
  TimescaleClickHandler,
} from "./types";
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
import { ReactNode, useCallback, useMemo, useRef } from "react";
import h from "./hyper";

export * from "./intervals-api";
export type { Interval } from "./types";
export {
  IncreaseDirection,
  TimescaleOrientation,
  defaultIntervals as intervals,
};

interface TimescaleDisplayProps {
  intervalStyle?: IntervalStyleBuilder;
  labelProps?: LabelProps;
  onClick?: TimescaleClickHandler;
}

export interface TimescaleProps extends TimescaleDisplayProps {
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
  cursorPosition?: number | null;
  cursorComponent?: any;
  scale?: ScaleContinuousNumeric<number, number>;
}

function TimescaleContainer(
  props: TimescaleDisplayProps & {
    className: string;
    children?: ReactNode;
  },
) {
  const {
    onClick: clickHandler,
    intervalStyle,
    labelProps,
    children,
    ...rest
  } = props;
  const { scale, orientation, timescale } = useTimescale();

  const ref = useRef<HTMLDivElement | null>(null);

  const onClick = useCallback(
    (evt: any, interval: Interval | undefined) => {
      // Outer click handler
      const bbox = ref.current?.getBoundingClientRect();
      let age: number | undefined = undefined;
      if (bbox != null && scale != null) {
        const pos =
          orientation == TimescaleOrientation.HORIZONTAL
            ? evt.clientX - bbox.x
            : evt.clientY - bbox.y;
        age = scale.invert(pos);
      }
      clickHandler(evt, { age, interval });
    },
    [clickHandler, scale, orientation],
  );

  return h("div.timescale.timescale-container", { ref, onClick, ...rest }, [
    h(TimescaleBoxes, {
      interval: timescale,
      intervalStyle,
      onClick,
      labelProps,
    }),
    children,
  ]);
}

export function Timescale(props: TimescaleProps) {
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

  const [parentMap, timescale] = useMemo(() => {
    if (intervals.length == 0) {
      return [null, null];
    }
    return nestTimescale(rootInterval, intervals);
  }, [rootInterval, intervals]);

  const className = classNames(orientation, "increase-" + increaseDirection);

  if (parentMap == null || timescale == null) {
    return null;
  }

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
    h(TimescaleContainer, { className, intervalStyle, labelProps, onClick }, [
      h.if(showAgeAxis)(AgeAxis, axisProps),
      h.if(cursorPosition != null)(cursorComponent, { age: cursorPosition }),
    ]),
  );
}
