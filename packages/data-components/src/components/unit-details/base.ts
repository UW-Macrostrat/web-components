import styles from "./base.module.sass";
import hyper from "@macrostrat/hyper";

const h = hyper.styled(styles);

import classNames from "classnames";
import { mergeAgeRanges } from "@macrostrat/stratigraphy-utils";
import { Tag, BaseTagProps } from "./tag";
import { ReactNode } from "react";

export function DataField({
  label,
  value,
  inline = false,
  showIfEmpty = false,
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
}) {
  if (!showIfEmpty && (value == null || value === "") && children == null) {
    return null;
  }

  return h(
    "div.data-field",
    { className: classNames(className, { inline, flex: !inline }) },
    [
      h("div.label", label),
      h.if(value != null)("div.value-container", h(Value, { value, unit })),
      children,
    ]
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

export function IntervalField({ intervals }: { intervals: IntervalShort[] }) {
  const unique = uniqueIntervals(...intervals);
  const ageRange = mergeAgeRanges(unique.map((d) => [d.b_age, d.t_age]));
  return h([
    h(
      DataField,
      {
        label: "Intervals",
      },
      [
        unique.map((interval) => {
          return h(IntervalTag, {
            key: interval.id,
            interval,
            showAgeRange: true,
          });
        }),
        h(Value, { unit: "Ma", value: `${ageRange[0]} - ${ageRange[1]}` }),
      ]
    ),
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

interface IntervalTagProps extends Omit<BaseTagProps, "name"> {
  interval: IntervalShort;
  showAgeRange?: boolean;
}

export function IntervalTag({
  interval,
  showAgeRange = false,
  color,
  onClick,
  ...rest
}: IntervalTagProps) {
  return h(Tag, {
    onClick,
    name: interval.name,
    color: color ?? interval.color,
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
  label,
  className,
  children,
  onClick,
}: {
  label?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}) {
  return h(
    DataField,
    { className: classNames("tag-field", className), label },
    children
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
