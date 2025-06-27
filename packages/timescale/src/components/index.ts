import h from "../hyper";
import { useRef, useEffect, useState } from "react";
import { Interval, NestedInterval, TimescaleOrientation } from "../types";
import { useTimescale } from "../provider";
import { SizeAwareLabel } from "@macrostrat/ui-components";
import chroma from "chroma-js";

type SizeState = {
  label: number;
  container: number;
};

import { CSSProperties } from "react";

export type IntervalStyleBuilder =
  | CSSProperties
  | ((interval: Interval) => CSSProperties)
  | null;

function IntervalBox(props: {
  interval: Interval;
  showLabel?: boolean;
  intervalStyle: IntervalStyleBuilder;
  onClick: (e: Event, interval: Interval) => void;
}) {
  const { interval, showLabel = true, intervalStyle, onClick } = props;

  const [labelText, setLabelText] = useState<string>(interval.nam);

  let style: CSSProperties = {};
  if (typeof intervalStyle === "function") {
    style = intervalStyle(interval);
  } else if (intervalStyle != null) {
    style = intervalStyle;
  }

  style = { backgroundColor: interval.col, ...style };

  // if (backgroundColor != null && (color == null || borderColor == null)) {
  //   const base = chroma(backgroundColor);
  //   color ??= base.darken(0.3);
  //   borderColor ??= base.darken(-0.1);
  // }

  return h(SizeAwareLabel, {
    key: interval.oid,
    style,
    className:
      "interval-box " + (onClick && interval.int_id != null ? "clickable" : ""),
    labelClassName: "interval-label",
    label: labelText,
    onVisibilityChanged(viz) {
      if (!viz && labelText.length > 1) {
        setLabelText(labelText[0]);
      }
    },
    onClick: (e) => onClick(e, interval),
  });
}

function IntervalChildren({ children, intervalStyle, onClick }) {
  if (children == null || children.length == 0) return null;
  return h(
    "div.children",
    children.map((d) => {
      return h(TimescaleBoxes, { interval: d, intervalStyle, onClick });
    }),
  );
}

function ensureIncreasingAgeRange(ageRange) {
  return [Math.min(...ageRange), Math.max(...ageRange)];
}

function TimescaleBoxes(props: {
  interval: NestedInterval;
  intervalStyle: IntervalStyleBuilder;
  onClick: (e: Event, interval: Interval) => void;
}) {
  const { interval, intervalStyle, onClick } = props;
  const { scale, orientation, levels, ageRange } = useTimescale();
  const { eag, lag, lvl } = interval;

  // If we don't have an ageRange and scale, we don't specify the length.
  let length = null;

  // This age range extends further than any realistic constraints
  const expandedAgeRange = ensureIncreasingAgeRange(ageRange) ?? [-50, 5000];

  // If we have a scale, give us the boundaries clipped to the age range if appropriate
  if (scale != null) {
    const startAge = Math.min(expandedAgeRange[1], eag);
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

  // Don't render if we are fully outside the age range of interest
  if (eag < expandedAgeRange[0]) return null;
  if (lag > expandedAgeRange[1]) return null;

  const className = slugify(name);

  return h("div.interval", { className, style }, [
    h.if(lvl >= minLevel)(IntervalBox, { interval, intervalStyle, onClick }),
    h.if(lvl < maxLevel)(IntervalChildren, {
      children,
      intervalStyle,
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
