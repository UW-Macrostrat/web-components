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

export function IntervalField({ intervals }: { intervals: IntervalShort[] }) {
  const unique = uniqueIntervals(...intervals);
  const ageRange = mergeAgeRanges(unique.map((d) => [d.b_age, d.t_age]));
  return h([
    h(DataField, { label: "Intervals" }, [
      unique.map((interval) => {
        return h(IntervalTag, {
          key: interval.id,
          interval,
          showAgeRange: false,
        });
      }),
      h(AgeRange, { b_age: ageRange[0], t_age: ageRange[1] }),
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

interface IntervalTagProps
  extends Omit<BaseTagProps, "name">, ItemInteractionProps {
  interval: IntervalShort;
  showAgeRange?: boolean;
}

export function IntervalTag({
  interval,
  showAgeRange = false,
  color,
  ...rest
}: IntervalTagProps) {
  const interactionProps = useInteractionProps({ int_id: interval.id });

  let details = null;
  if (showAgeRange) {
    details = h(AgeRange, { b_age: interval.b_age, t_age: interval.t_age });
  }

  return h(Tag, {
    name: interval.name,
    color: color ?? interval.color,
    details,
    ...interactionProps,
    ...rest,
  });
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
