import { Button } from "@blueprintjs/core";
import {
  IntervalShort,
  IntervalTag,
  Tag,
  TagSize,
  useInteractionProps,
} from "@macrostrat/data-components";
import type { Interval } from "@macrostrat/timescale";
import classNames from "classnames";
import h from "./age-window-tag.module.sass";
import { AgeRange } from "./age-range";
import type { AgeWindow } from "../animated-age-window";

/** Adapt a timescale `Interval` (as delivered by a `Timescale` click, with
 * `eag`/`lag`/`nam`/`col`) to the `IntervalShort` shape the tag components
 * take. The id prefers the Macrostrat `int_id` when the interval tree was built
 * from the API, falling back to the interval's own `oid`. */
export function intervalShortFromTimescale(interval: Interval): IntervalShort {
  return {
    id: interval.int_id ?? interval.oid,
    name: interval.nam,
    color: interval.col,
    b_age: interval.eag,
    t_age: interval.lag,
    rank: interval.lvl,
  };
}

export interface AgeWindowTagProps {
  /** The interval the window was set from, if any. */
  interval?: IntervalShort | null;
  /** The rendered window. When it differs from the interval's own span (a
   * refined window) it is shown in place of the interval's range. */
  window?: AgeWindow | null;
  /** Renders a clear button when given. */
  onClear?: () => void;
  size?: TagSize;
  className?: string;
}

/** A compact, clearable indicator of the age window a column or correlation
 * chart is focused on — an interval tag (linking to the interval, with its
 * range) or a bare age range. Renders nothing without an interval or window,
 * so it can live permanently in a chart's `axisTopContent`. */
export function AgeWindowTag(props: AgeWindowTagProps) {
  const {
    interval = null,
    window = null,
    onClear,
    size = TagSize.Small,
    className,
  } = props;
  if (interval == null && window == null) return null;

  let tag = null;
  if (interval == null) {
    tag = h(Tag, { size, name: h(AgeRange, { data: window }) });
  } else if (window == null || windowMatchesInterval(window, interval)) {
    tag = h(IntervalTag, { interval, showAgeRange: true, size });
  } else {
    tag = h(RefinedIntervalTag, { interval, window, size });
  }

  return h("span.age-window-tag", { className: classNames(className) }, [
    tag,
    h.if(onClear != null)(Button, {
      className: "clear-button",
      icon: "cross",
      minimal: true,
      small: true,
      title: "Clear",
      onClick: onClear,
    }),
  ]);
}

function RefinedIntervalTag({
  interval,
  window,
  size,
}: {
  interval: IntervalShort;
  window: AgeWindow;
  size: TagSize;
}) {
  const interaction = useInteractionProps({ int_id: interval.id });
  return h(Tag, {
    ...interaction,
    size,
    name: interval.name,
    color: interval.color,
    details: h(AgeRange, { data: window }),
  });
}

function windowMatchesInterval(
  window: AgeWindow,
  interval: IntervalShort,
): boolean {
  return window.t_age === interval.t_age && window.b_age === interval.b_age;
}
