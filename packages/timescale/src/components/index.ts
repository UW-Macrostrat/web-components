import h from "../main.module.sass";
import { useEffect, useMemo, useState } from "react";
import { Interval, NestedInterval, TimescaleOrientation } from "../types";
import { useTimescale } from "../provider";
import { SizeAwareLabel } from "@macrostrat/ui-components";
import classNames from "classnames";

import { CSSProperties } from "react";

export type IntervalStyleBuilder =
  | CSSProperties
  | ((interval: Interval) => CSSProperties)
  | null;

export type LabelProps = {
  shouldShow?: boolean;
  allowRotation?: boolean;
  positionTolerance?: number;
};

/** Track a value but only report it once it has stopped changing for `delay`
 * ms. During a zoom animation the box size changes every frame, so this holds
 * label re-fitting until the animation settles. */
function useSettledValue<T>(value: T, delay: number = 200): T {
  const [settled, setSettled] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return settled;
}

function IntervalBox(props: {
  interval: Interval;
  labelProps?: LabelProps;
  intervalStyle: IntervalStyleBuilder;
  allowLabelRotation?: boolean;
  /** The box's pixel size along the axis; used to re-fit the label when the
   * scale settles at a new zoom level. */
  size?: number | null;
  onClick: (e: Event, interval: Interval) => void;
}) {
  const { interval, intervalStyle, onClick, labelProps = {}, size } = props;

  const [labelText, setLabelText] = useState<string>(interval.nam);

  // When the box settles at a new size (e.g. after a zoom), reset to the full
  // name so the fit check below can re-abbreviate or restore it. Debounced, so
  // this happens once the animation ends rather than on every frame.
  const settledSize = useSettledValue(size ?? null);
  useEffect(() => {
    setLabelText(interval.nam);
  }, [settledSize, interval.nam]);

  const _onClick = useMemo(() => {
    if (onClick == null) return null;
    return (e) => onClick(e, interval);
  }, [onClick, interval]);

  let style: CSSProperties = {};
  if (typeof intervalStyle === "function") {
    style = intervalStyle(interval);
  } else if (intervalStyle != null) {
    style = intervalStyle;
  }
  // Set interval color if not already set by the logic above
  style.backgroundColor ??= interval.col;

  const className = classNames("interval-box", {
    clickable: onClick != null,
  });

  return h(SizeAwareLabel, {
    key: interval.oid,
    style,
    className,
    labelClassName: "interval-label",
    label: labelText,
    // Force a re-measure when the box settles at a new size, so the fit is
    // re-evaluated on zoom (both directions) rather than only at mount.
    remeasureKey: settledSize,
    ...labelProps,
    onVisibilityChanged(viz) {
      if (!viz && labelText.length > 1) {
        setLabelText(labelText[0]);
      }
    },
    onClick: _onClick,
  });
}

function IntervalChildren({ children, intervalStyle, labelProps, onClick }) {
  if (children == null || children.length == 0) return null;
  return h(
    "div.children",
    children.map((d) => {
      return h(TimescaleBoxes, {
        interval: d,
        intervalStyle,
        labelProps,
        onClick,
      });
    }),
  );
}

function ensureIncreasingAgeRange(ageRange) {
  return [Math.min(...ageRange), Math.max(...ageRange)];
}

function TimescaleBoxes(props: {
  interval: NestedInterval;
  intervalStyle: IntervalStyleBuilder;
  labelProps?: LabelProps;
  onClick: (e: Event, interval: Interval) => void;
}) {
  const { interval, intervalStyle, onClick, labelProps } = props;
  const { scale, orientation, levels, ageRange } = useTimescale();
  const { eag, lag, lvl } = interval;

  // If we don't have an ageRange and scale, we don't specify the length.
  let length = null;

  // This age range extends further than any realistic constraints
  const expandedAgeRange = ensureIncreasingAgeRange(ageRange) ?? [-50, 5000];

  // If we have a scale, give us the boundaries clipped to the age range if appropriate

  // Don't render if we are fully outside the age range of interest
  if (eag < expandedAgeRange[0]) return null;
  if (lag > expandedAgeRange[expandedAgeRange.length - 1]) return null;

  if (scale != null) {
    const startAge = Math.min(
      expandedAgeRange[expandedAgeRange.length - 1],
      eag,
    );
    const endAge = Math.max(expandedAgeRange[0], lag);
    length = Math.abs(scale(startAge) - scale(endAge));
  }

  let style = {};
  if (orientation == TimescaleOrientation.HORIZONTAL) {
    style["width"] = length;
  } else {
    style["height"] = length;
  }

  const [minLevel, maxLevel] = levels ?? [0, 5];

  const { children, nam: name } = interval;

  const className = slugify(name);

  return h("div.interval", { className, style }, [
    h.if(lvl >= minLevel)(IntervalBox, {
      interval,
      intervalStyle,
      onClick,
      labelProps,
      size: length,
    }),
    h.if(lvl < maxLevel)(IntervalChildren, {
      children,
      intervalStyle,
      labelProps,
      onClick,
    }),
  ]);
}

// A simple slugify function
function slugify(str) {
  return String(str)
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
}

export { TimescaleBoxes };
export * from "./cursor";
