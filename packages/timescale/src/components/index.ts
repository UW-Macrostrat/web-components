import h from "@macrostrat/hyper";
import { useRef, useEffect, useState } from "react";
import { Interval, NestedInterval, TimescaleOrientation } from "../types";
import { useTimescale } from "../provider";

function IntervalBox(props: { interval: Interval; showLabel?: boolean }) {
  const { interval: d, showLabel = true } = props;

  const containerRef = useRef<HTMLElement>();
  const labelRef = useRef<HTMLElement>();
  const [sizes, setSizes] = useState({ label: 0, container: 0 });

  const { orientation } = useTimescale();
  const key =
    orientation == TimescaleOrientation.HORIZONTAL
      ? "clientWidth"
      : "clientHeight";
  useEffect(() => {
    const container = containerRef.current?.[key] ?? 0;
    const label = labelRef.current?.[key] ?? 0;
    setSizes({ container, label });
  }, [containerRef, labelRef]);

  let labelText = d.nam;
  if (sizes.container < 10) {
    labelText = "";
  } else if (sizes.label > sizes.container) {
    labelText = d.nam[0];
  }

  return h(
    "div.interval-box",
    { key: d.oid, style: { backgroundColor: d.col }, ref: containerRef },
    h.if(showLabel)("span.interval-label", [
      h("span.interval-label-text", { ref: labelRef }, labelText),
    ])
  );
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
