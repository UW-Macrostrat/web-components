import {
  DataField,
  IntervalShort,
  IntervalTag,
  type IntervalTagProps,
  ItemList,
  Value,
} from "@macrostrat/data-components";
import { useMacrostratDefs } from "@macrostrat/data-provider";
import h from "./age-range.module.sass";
import { formatProportion, formatRange } from "./utils";
import classNames from "classnames";
import { useMemo } from "react";

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
  /** Component to display a single age value with unit conversion from
   * Ma to ka or Ga as appropriate.
   */
  const [value, unit] = getAge(age);

  const _value = value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits,
  });

  return h(Value, { value: _value, unit, className });
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

  /** Get interval information */
  const intervalMap = useMacrostratDefs("intervals");
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
    p1 = h(Proportion, { value: t_prop });

    if (i0 !== i1 || b_prop !== 0 || t_prop !== 1) {
      // We have a single interval with undefined proportions
      p0 = h(Proportion, { value: b_prop });
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
  console.log(age, interval);
  return (interval.b_age - age) / (interval.b_age - interval.t_age);
}

function Proportion({ value }) {
  let content = null;
  if (value == 0) {
    content = "base";
  } else if (value == 1) {
    content = "top";
  } else {
    content = formatProportion(value * 100) + "%";
  }

  return h("span.proportion", content);
}

export function getAgeRange(_unit) {
  let b_age = _unit.b_age;
  let t_age = _unit.t_age;
  let unit = "Ma";

  if (b_age < 0.8 && t_age < 1.2) {
    b_age *= 1000;
    t_age *= 1000;
    unit = "ka";
  } else if (b_age > 800 && t_age > 1200) {
    b_age /= 1000;
    t_age /= 1000;
    unit = "Ga";
  }

  return [b_age, t_age, unit];
}

export function getAge(value) {
  /** Get the age value in Ma, ka, or Ga as appropriate */
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
