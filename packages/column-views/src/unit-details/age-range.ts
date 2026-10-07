import h from "@macrostrat/hyper";
import { DataField, getAgeRange, Value } from "@macrostrat/data-components";
import { formatRange } from "./utils";

// Interval tags and ranges, their proportions and age labels live in
// `@macrostrat/data-components`; re-exported under their names here.
export {
  AgeLabel,
  AgeRangeFlavor,
  buildIntervalAgeRange,
  getAge,
  getAgeRange,
  IntervalAgeRange,
  IntervalProportion as Proportion,
  IntervalProportions,
} from "@macrostrat/data-components";
export type {
  IntervalAgeRangeData,
  IntervalAgeRangeProps,
  IntervalAgeRangeSpec,
  IntervalProportionsProps,
} from "@macrostrat/data-components";

export function AgeField({ unit, children, ...rest }) {
  const [_b_age, _t_age, _unit] = getAgeRange(unit);

  return h(
    DataField,
    {
      label: "Age",
      value: formatRange(_b_age, _t_age),
      unit: _unit,
      ...rest,
    },
    children,
  );
}

export function AgeRange({
  data,
  className,
}: {
  data: {
    t_age: number;
    b_age: number;
  };
  className?: string;
}) {
  const [_b_age, _t_age, _unit] = getAgeRange(data);

  return h(Value, {
    value: formatRange(_b_age, _t_age),
    unit: _unit,
    className,
  });
}

export function Duration({
  value,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
}) {
  let unit = "Myr";
  if (value < 0.8) {
    unit = "kyr";
    value *= 1000;
    if (value < 5) {
      unit = "yr";
      value *= 1000;
    }
  } else if (value > 1000) {
    unit = "Gyr";
    value /= 1000;
  }

  let _value = value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits,
  });

  return h(Value, { value: _value, unit });
}
