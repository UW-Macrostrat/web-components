import styles from "./index.module.sass";
import hyper from "@macrostrat/hyper";

const h = hyper.styled(styles);

import classNames from "classnames";
import { mergeAgeRanges } from "@macrostrat/stratigraphy-utils";
import { LithologyTag } from "./lithology-tag";

export * from "./lithology-tag";

export function DataField({
  label,
  value,
  inline = true,
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

  return h("div.data-field", { className: classNames(className, { inline }) }, [
    h("div.label", label),
    h("div.data-container", [
      h.if(value != null)(Value, { value, unit }),
      children,
    ]),
  ]);
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
          return h(Interval, {
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
  children,
}: {
  value?: any;
  unit?: string;
  children?: any;
}) {
  const val = value ?? children;
  return h("span.value-container", [
    h("span.value", val),
    h.if(unit != null)([" ", h("span.unit", unit)]),
  ]);
}

export function Interval({
  interval,
  showAgeRange = false,
}: {
  interval: IntervalID;
  proportion?: number;
  showAgeRange?: boolean;
}) {
  return h(LithologyTag, {
    data: interval,
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
