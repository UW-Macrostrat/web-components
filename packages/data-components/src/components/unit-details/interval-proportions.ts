import { useMacrostratDefs } from "@macrostrat/data-provider";
import classNames from "classnames";
import { useMemo } from "react";
import {
  IntervalProportion,
  type IntervalShort,
  IntervalTag,
  type IntervalTagProps,
} from "./base";
import { ItemList } from "./tag";
import h from "./interval-range.module.sass";

interface UnitIntervalConstraints {
  b_int_id?: number;
  t_int_id?: number;
  b_prop?: number;
  t_prop?: number;
  b_int_name?: string;
  t_int_name?: string;
  b_age?: number;
  t_age?: number;
}

export interface IntervalProportionsProps extends Omit<
  IntervalTagProps,
  "interval"
> {
  unit: UnitIntervalConstraints;
  showProportions?: boolean;
  calculateProportionsFromAges?: boolean;
  onClickItem?: any;
}

export function IntervalProportions({
  unit,
  className,
  showProportions,
  calculateProportionsFromAges = true,
  ...rest
}: IntervalProportionsProps) {
  /** Display the proportions of the unit that belong to the base and top intervals, if they are different */
  if (unit.b_int_id == null && unit.t_int_id == null) return null;

  let _showProps = showProportions;

  const i0 = unit.b_int_id;
  const i1 = unit.t_int_id;

  const ints = new Set([i0, i1]);

  /** Get interval information */
  const intervalMap = useMacrostratDefs("intervals", Array.from(ints), null);
  const [int0, int1] = useMemo(() => {
    const int0 = intervalMap?.get(i0) ?? {};
    if (i0 === i1) {
      return [int0, int0];
    }
    const int1 = intervalMap?.get(i1) ?? {};
    return [int0, int1];
  }, [intervalMap, i0, i1]);

  const interval0: IntervalShort = {
    id: i0,
    name: unit.b_int_name,
    ...int0,
  };

  let b_prop = unit.b_prop;
  let t_prop = unit.t_prop;

  // If we have b_age and t_age, then we can calculate proportions if they are not given
  if (b_prop == null && unit.b_age != null && calculateProportionsFromAges) {
    b_prop = getProportion(unit.b_age, int0);
  }
  if (t_prop == null && unit.t_age != null && calculateProportionsFromAges) {
    t_prop = getProportion(unit.t_age, int1);
  }

  // If there are no proportions given and we are not explicitly directed to show them,
  // then we set them to hidden.
  if (b_prop == null && t_prop == null) {
    _showProps ??= false;
  }

  /*
    Set default proportions to 0 and 1 if they are not given,
    so that we can display "base" and "top" labels
   */
  b_prop ??= 0;
  t_prop ??= 1;

  let p0: any = null;
  let p1: any = null;

  if (_showProps !== false) {
    p1 = h(IntervalProportion, { value: t_prop });

    if (i0 !== i1 || b_prop !== 0 || t_prop !== 1) {
      // We have a single interval with undefined proportions
      p0 = h(IntervalProportion, { value: b_prop });
    }

    if (i0 === i1 && (b_prop !== 0 || t_prop !== 1)) {
      p0 = h("span.joint-proportion", [p0, " ", h("span.sep", "to"), " ", p1]);
    }
  }

  return h(
    ItemList,
    { className: classNames("interval-proportions", className) },
    [
      h(IntervalTag, {
        interval: interval0,
        prefix: p0,
        ...rest,
      }),
      h.if(i0 != i1)("span.discourage-break", [
        h("span.sep", " to "),
        h(IntervalTag, {
          interval: {
            id: i1,
            name: unit.t_int_name,
            ...int1,
          },
          prefix: p1,
          ...rest,
        }),
      ]),
    ],
  );
}

function getProportion(age: number, interval: IntervalShort): number | null {
  /** Get proportion with the age */
  return (interval.b_age - age) / (interval.b_age - interval.t_age);
}
