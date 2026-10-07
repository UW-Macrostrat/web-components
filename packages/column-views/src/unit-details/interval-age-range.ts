import {
  AgeLabel,
  IntervalProportion,
  type IntervalShort,
  IntervalTag,
  type IntervalTagProps,
  ItemList,
  Value,
} from "@macrostrat/data-components";
import { useMacrostratDefs } from "@macrostrat/data-provider";
import classNames from "classnames";
import { type ReactNode, useMemo } from "react";
import h from "./age-range.module.sass";
import { getAgeRange } from "./age-range";

/** What an interval range says about where, within its intervals, a span of
 * time sits. */
export enum AgeRangeFlavor {
  /** Interval names only: "Norian to Rhaetian". */
  None = "none",
  /** The position within each interval: "Norian to Rhaetian | 75%". */
  Proportion = "proportion",
  /** Ages, always: they say more than the interval names, even for a whole
   * interval. An age on its interval's boundary belongs to the interval and
   * goes in its tag; any other age is the span's own, and follows the tag:
   * "Norian 216.5 Ma to Rhaetian | 201.4 Ma". */
  Ages = "ages",
  /** Positions and ages together, with ages as for `ages`:
   * "Norian | 50% 216.5 Ma to Rhaetian | 201.4 Ma". */
  Both = "both",
}

export interface IntervalAgeRangeData {
  b_int_id?: number;
  t_int_id?: number;
  b_int_name?: string;
  t_int_name?: string;
  /** Position of the base within the base interval (0 at its base, 1 at its
   * top). Calculated from `b_age` if not given. */
  b_prop?: number;
  /** Position of the top within the top interval. */
  t_prop?: number;
  b_age?: number;
  t_age?: number;
}

export interface IntervalAgeRangeProps extends Omit<
  IntervalTagProps,
  "interval" | "proportion" | "age" | "showAgeRange" | "details"
> {
  unit: IntervalAgeRangeData;
  flavor?: AgeRangeFlavor | `${AgeRangeFlavor}`;
  /** Always print positions within the intervals, even where the span
   * reaches an interval boundary and they're implied: "Cretaceous | base to
   * top". (Ages always print.) */
  verbose?: boolean;
  /** Derive positions within the intervals from `b_age`/`t_age` when
   * `b_prop`/`t_prop` aren't given (default true). */
  calculateProportionsFromAges?: boolean;
}

/** A span of time as the interval(s) it runs between, e.g.
 *
 * - `[Norian] to [Rhaetian]`
 * - `[Norian] to [Rhaetian | 75%]` (proportion)
 * - `[Norian | base] to [Rhaetian | 75%]` (proportion, verbose)
 * - `[Cretaceous | base to top]` (one interval, verbose)
 * - `[Norian] 216.5 Ma to [Rhaetian | 201.4 Ma]` (ages)
 * - `[Cretaceous | 143.1–66 Ma]` (ages, one whole interval)
 * - `[Norian | 50%] 216.5 Ma to [Rhaetian | 201.4 Ma]` (both)
 * - `[Berriasian | 143.1 Ma] to [Santonian | 83.6 Ma]` (both, whole intervals)
 *
 * Interval colors and ages come from the Macrostrat interval definitions. */
export function IntervalAgeRange({
  unit,
  flavor = AgeRangeFlavor.Proportion,
  verbose = false,
  calculateProportionsFromAges = true,
  className,
  ...rest
}: IntervalAgeRangeProps) {
  const i0 = unit.b_int_id ?? unit.t_int_id;
  const i1 = unit.t_int_id ?? unit.b_int_id;

  const ids = useMemo(() => [i0, i1], [i0, i1]);
  const intervalMap = useMacrostratDefs("intervals", ids, null);
  const [int0, int1] = useMemo((): [IntervalShort, IntervalShort] => {
    const int0 = {
      id: i0,
      name: unit.b_int_name ?? unit.t_int_name,
      ...intervalMap?.get(i0),
    };
    const int1 = {
      id: i1,
      name: unit.t_int_name ?? unit.b_int_name,
      ...intervalMap?.get(i1),
    };
    return [int0, int1];
  }, [intervalMap, i0, i1, unit.b_int_name, unit.t_int_name]);

  if (i0 == null) return null;

  const spec = buildIntervalAgeRange(unit, int0, int1, {
    flavor: flavor as AgeRangeFlavor,
    verbose,
    calculateProportionsFromAges,
  });

  return h(
    ItemList,
    { className: classNames("interval-age-range", className) },
    [
      h("span.discourage-break", [
        h(IntervalTag, { interval: int0, details: spec.baseDetails, ...rest }),
        spec.baseAfter,
      ]),
      h.if(spec.singleInterval == false)("span.discourage-break", [
        h("span.sep", "to"),
        h(IntervalTag, { interval: int1, details: spec.topDetails, ...rest }),
        spec.topAfter,
      ]),
    ],
  );
}

export interface IntervalAgeRangeSpec {
  singleInterval: boolean;
  /** Shown inside the base (or only) interval's tag */
  baseDetails: ReactNode;
  /** Shown inside the top interval's tag */
  topDetails: ReactNode;
  /** Shown right after the base (or only) interval's tag */
  baseAfter: ReactNode;
  /** Shown right after the top interval's tag */
  topAfter: ReactNode;
}

/** Decide what each part of an interval range shows. Interval ages may be
 * missing (definitions not yet loaded); the range then falls back to what the
 * span itself records. */
export function buildIntervalAgeRange(
  unit: IntervalAgeRangeData,
  int0: Partial<IntervalShort>,
  int1: Partial<IntervalShort>,
  {
    flavor = AgeRangeFlavor.Proportion,
    verbose = false,
    calculateProportionsFromAges = true,
  }: {
    flavor?: AgeRangeFlavor;
    verbose?: boolean;
    calculateProportionsFromAges?: boolean;
  } = {},
): IntervalAgeRangeSpec {
  const singleInterval = int0.id === int1.id;
  const spec = emptySpec(singleInterval);

  if (flavor == AgeRangeFlavor.Ages) {
    return buildAgesSpec(spec, unit, int0, int1);
  }

  if (flavor == AgeRangeFlavor.Proportion || flavor == AgeRangeFlavor.Both) {
    buildProportionSpec(spec, unit, int0, int1, {
      verbose,
      calculateProportionsFromAges,
    });
  }

  if (flavor == AgeRangeFlavor.Both) {
    const ages = buildAgesSpec(emptySpec(singleInterval), unit, int0, int1);
    spec.baseDetails = joinDetails(spec.baseDetails, ages.baseDetails);
    spec.topDetails = joinDetails(spec.topDetails, ages.topDetails);
    spec.baseAfter = ages.baseAfter;
    spec.topAfter = ages.topAfter;
  }

  return spec;
}

function emptySpec(singleInterval: boolean): IntervalAgeRangeSpec {
  return {
    singleInterval,
    baseDetails: null,
    topDetails: null,
    baseAfter: null,
    topAfter: null,
  };
}

/** A position and an age in one tag's details: "base · 237 Ma" */
function joinDetails(position: ReactNode, age: ReactNode): ReactNode {
  if (position == null) return age;
  if (age == null) return position;
  return h("span.joint-details", [position, h("span.sep", "·"), age]);
}

function buildProportionSpec(
  spec: IntervalAgeRangeSpec,
  unit: IntervalAgeRangeData,
  int0: Partial<IntervalShort>,
  int1: Partial<IntervalShort>,
  { verbose, calculateProportionsFromAges },
) {
  let b_prop = unit.b_prop;
  let t_prop = unit.t_prop;
  if (calculateProportionsFromAges) {
    b_prop ??= getProportion(unit.b_age, int0);
    t_prop ??= getProportion(unit.t_age, int1);
  }
  // Unknown positions are taken to be the interval boundaries
  b_prop = snapProportion(b_prop ?? 0);
  t_prop = snapProportion(t_prop ?? 1);

  const showBase = verbose || b_prop != 0;
  const showTop = verbose || t_prop != 1;

  if (spec.singleInterval) {
    // One interval: its two positions read as a single span ("25% to top")
    if (!showBase && !showTop) return;
    spec.baseDetails = h("span.joint-proportion", [
      h(IntervalProportion, { value: b_prop }),
      h("span.sep", "to"),
      h(IntervalProportion, { value: t_prop }),
    ]);
    return;
  }

  if (showBase) {
    spec.baseDetails = h(IntervalProportion, { value: b_prop });
  }
  if (showTop) {
    spec.topDetails = h(IntervalProportion, { value: t_prop });
  }
}

function buildAgesSpec(
  spec: IntervalAgeRangeSpec,
  unit: IntervalAgeRangeData,
  int0: Partial<IntervalShort>,
  int1: Partial<IntervalShort>,
): IntervalAgeRangeSpec {
  // Ages always show. An age on its interval's boundary belongs to the
  // interval, and goes in the interval's tag; an age within the interval is
  // the span's own, and follows the tag. A span without an age at one end is
  // taken to reach the interval's boundary.
  const baseOwned = unit.b_age == null || agesMatch(unit.b_age, int0.b_age);
  const topOwned = unit.t_age == null || agesMatch(unit.t_age, int1.t_age);

  if (spec.singleInterval) {
    if (!baseOwned || !topOwned) {
      spec.baseAfter = h(
        "span.span-age",
        h(AgeRangeValue, {
          b_age: unit.b_age ?? int0.b_age,
          t_age: unit.t_age ?? int0.t_age,
        }),
      );
    } else if (int0.b_age != null && int0.t_age != null) {
      spec.baseDetails = h(AgeRangeValue, {
        b_age: int0.b_age,
        t_age: int0.t_age,
      });
    }
    return spec;
  }

  if (!baseOwned) {
    spec.baseAfter = h("span.span-age", h(AgeLabel, { age: unit.b_age }));
  } else if (int0.b_age != null) {
    spec.baseDetails = h(AgeLabel, { age: int0.b_age });
  }

  if (!topOwned) {
    spec.topAfter = h("span.span-age", h(AgeLabel, { age: unit.t_age }));
  } else if (int1.t_age != null) {
    spec.topDetails = h(AgeLabel, { age: int1.t_age });
  }
  return spec;
}

function AgeRangeValue({ b_age, t_age }: { b_age: number; t_age: number }) {
  const [b, t, unit] = getAgeRange({ b_age, t_age });
  let value = formatAge(b);
  if (!agesMatch(b_age, t_age)) {
    value += "–" + formatAge(t);
  }
  return h(Value, { className: "age-range", value, unit });
}

function getProportion(
  age: number | undefined,
  interval: Partial<IntervalShort>,
): number | null {
  if (age == null || interval.b_age == null || interval.t_age == null) {
    return null;
  }
  const span = interval.b_age - interval.t_age;
  if (span <= 0) return null;
  return (interval.b_age - age) / span;
}

/** Clamp to the interval and snap positions within rounding of its
 * boundaries, so they read as "base" and "top" */
function snapProportion(value: number): number {
  const v = Math.min(Math.max(value, 0), 1);
  if (v < proportionTolerance) return 0;
  if (v > 1 - proportionTolerance) return 1;
  return v;
}

const proportionTolerance = 0.001;

/** Ages agree to within 1 kyr (or the rounding of the API's 4 decimals) */
function agesMatch(a: number | undefined, b: number | undefined): boolean {
  if (a == null || b == null) return a == b;
  return Math.abs(a - b) < 0.001;
}

function formatAge(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
