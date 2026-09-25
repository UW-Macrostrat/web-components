import h from "./main.module.sass";

import classNames from "classnames";
import { mergeAgeRanges } from "@macrostrat/stratigraphy-utils";
import { Tag, BaseTagProps, BaseTagList, ItemList } from "./tag";
import { ReactNode } from "react";
import { ItemInteractionProps, useInteractionProps } from "../../data-links.ts";

export function DataField({
  label,
  value,
  inline = false,
  showIfEmpty = false,
  row = false,
  className,
  children,
  unit,
}: {
  label?: string;
  value?: any;
  inline?: boolean;
  showIfEmpty?: boolean;
  className?: string;
  children?: any;
  unit?: string;
  row?: boolean;
}) {
  if (!showIfEmpty && (value == null || value === "") && children == null) {
    return null;
  }

  return h(
    "div.data-field",
    { className: classNames(className, { inline, flex: !inline, row }) },
    [
      h("div.label", label),
      h.if(value != null)("div.value-container", h(Value, { value, unit })),
      children,
    ],
  );
}

export type IntervalID = {
  id: number;
  name: string;
};

export type IntervalShort = IntervalID & {
  b_age: number;
  t_age: number;
  color: string;
  rank: number;
};

function AgeRange({
  b_age,
  t_age,
  unit = "Ma",
}: {
  b_age: number;
  t_age: number;
  unit?: string;
}) {
  return h(Value, {
    className: "age-range",
    value: `${b_age}–${t_age}`,
    unit,
  });
}

export function IntervalField({
  intervals,
  showAgeRange = true,
}: {
  intervals: IntervalShort[];
  showAgeRange?: boolean;
}) {
  const unique = uniqueIntervals(...intervals);
  const ageRange = mergeAgeRanges(unique.map((d) => [d.b_age, d.t_age]));
  const showAgeRangeInline = unique.length == 1 && showAgeRange;
  return h([
    h(DataField, { label: "Intervals" }, [
      unique.map((interval) => {
        return h(IntervalTag, {
          key: interval.id,
          interval,
          showAgeRange: showAgeRangeInline,
          multiLine: showAgeRangeInline,
        });
      }),
      h.if(unique.length > 1 && showAgeRange)(AgeRange, {
        b_age: ageRange[0],
        t_age: ageRange[1],
      }),
    ]),
  ]);
}

export function Value({
  value,
  unit,
  className,
  children,
}: {
  value?: any;
  unit?: string;
  children?: any;
  className?: string;
}) {
  const val = value ?? children;
  return h("span.value-container", { className }, [
    h("span.value", val),
    h.if(unit != null)([" ", h("span.unit", unit)]),
  ]);
}

export interface IntervalTagProps
  extends Omit<BaseTagProps, "name">, ItemInteractionProps {
  interval: IntervalShort;
  /** A position within the interval (0 at its base, 1 at its top), drawn as
   * the tag's prefix: "base", "top" or a percent. */
  proportion?: number | null;
  /** An age, drawn as the tag's details. Takes the place of the age range. */
  age?: number | null;
  /** Draw the interval's age range as the tag's details. */
  showAgeRange?: boolean;
  /** Link to the interval when an interaction manager is present (default). */
  interactive?: boolean;
}

/** An interval as a tag in its own colour. A position within the interval
 * goes in the prefix, and an age — or the interval's range — in the
 * details, so a calibration reads "25% | Devonian | 404.4 Ma". */
export function IntervalTag({
  interval,
  proportion,
  age,
  showAgeRange = false,
  interactive = true,
  color,
  prefix,
  details,
  ...rest
}: IntervalTagProps) {
  const interactionProps = useInteractionProps(
    { int_id: interval.id },
    interactive,
  );

  let _prefix = prefix;
  if (_prefix == null && proportion != null) {
    _prefix = h(IntervalProportion, { value: proportion });
  }

  let _details = details;
  if (_details == null && age != null) {
    _details = h(AgeLabel, { age });
  } else if (_details == null && showAgeRange) {
    _details = h(AgeRange, { b_age: interval.b_age, t_age: interval.t_age });
  }

  return h(Tag, {
    name: interval.name,
    color: color ?? interval.color,
    prefix: _prefix,
    details: _details,
    ...interactionProps,
    ...rest,
  });
}

/** A position within an interval: "base" at 0, "top" at 1, else a percent. */
export function IntervalProportion({ value }: { value: number }) {
  return h("span.interval-proportion", formatIntervalProportion(value));
}

export function formatIntervalProportion(value: number): string {
  if (value == 0) return "base";
  if (value == 1) return "top";
  return (value * 100).toFixed(1) + "%";
}

/** A single age, in Ma, ka or Ga as suits its size. */
export function AgeLabel({
  age,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
  className,
}: {
  age: number;
  className?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}) {
  const [value, unit] = getAge(age);

  const _value = value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits,
  });

  return h(Value, { value: _value, unit, className });
}

/** An age in Ma as a value and the unit that suits it: Ma, ka, yr or Ga. */
export function getAge(value: number): [number, string] {
  let unit = "Ma";
  if (value < 0.8) {
    unit = "ka";
    value *= 1000;
    if (value < 5) {
      unit = "yr";
      value *= 1000;
    }
  } else if (value > 1000) {
    unit = "Ga";
    value /= 1000;
  }

  return [value, unit];
}

function uniqueIntervals(
  ...intervals: (IntervalShort | undefined)[]
): IntervalShort[] {
  const unique = new Map<number, IntervalShort>();
  for (const interval of intervals) {
    if (interval == null) continue;
    unique.set(interval.id, interval);
  }
  return Array.from(unique.values()).sort((a, b) => b.b_age - a.b_age);
}

export function TagField({
  className,
  children,
  ...rest
}: {
  label?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}) {
  return h(
    DataField,
    { className: classNames("tag-field", className), ...rest },
    children,
  );
}

export function Parenthetical({ children, className }) {
  if (children == null) return null;
  return h("span.parenthetical", { className }, [
    h("span.sep", "("),
    h("span.content", null, children),
    h("span.sep", ")"),
  ]);
}
