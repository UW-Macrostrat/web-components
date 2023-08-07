import h from "../hyper";
import { useRef, useEffect, useState } from "react";
import { Interval, NestedInterval, TimescaleOrientation } from "../types";
import { useTimescale } from "../provider";
import { SizeAwareLabel } from "@macrostrat/column-components";
import chroma from "chroma-js";

type SizeState = {
  label: number;
  container: number;
};

type LabelColorSetting = string | ((interval: Interval) => string) | null;

function IntervalBox(props: {
  interval: Interval;
  showLabel?: boolean;
  labelColor: LabelColorSetting;
  borderColor: LabelColorSetting;
}) {
  const { interval, showLabel = true, labelColor } = props;

  const [labelText, setLabelText] = useState<string>(interval.nam);

  const backgroundColor = interval.col;

  let color: string;
  if (typeof labelColor === "function") {
    color = labelColor(interval);
  } else {
    color = labelColor;
  }

  let borderColor: string;
  if (typeof props.borderColor === "function") {
    borderColor = props.borderColor(interval);
  } else {
    borderColor = props.borderColor;
  }

  // if (backgroundColor != null && (color == null || borderColor == null)) {
  //   const base = chroma(backgroundColor);
  //   color ??= base.darken(0.3);
  //   borderColor ??= base.darken(-0.1);
  // }

  return h(SizeAwareLabel, {
    key: interval.oid,
    style: { backgroundColor, color, borderColor },
    className: "interval-box",
    labelClassName: "interval-label",
    label: labelText,
    onVisibilityChanged(viz) {
      if (!viz && labelText.length > 1) {
        setLabelText(labelText[0]);
      }
    },
  });
}

function IntervalChildren({ children }) {
  if (children == null || children.length == 0) return null;
  return h(
    "div.children",
    children.map((d) => {
      return h(TimescaleBoxes, { interval: d });
    })
  );
}

function ensureIncreasingAgeRange(ageRange) {
  return [Math.min(...ageRange), Math.max(...ageRange)];
}

function TimescaleBoxes(props: { interval: NestedInterval }) {
  const { interval } = props;
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

  return h("div.interval", { className: name, style }, [
    h.if(lvl >= minLevel)(IntervalBox, { interval }),
    h.if(lvl < maxLevel)(IntervalChildren, { children }),
  ]);
}

export { TimescaleBoxes };
export * from "./cursor";
