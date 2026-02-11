import {
  DataField,
  IntervalShort,
  IntervalTag,
  ItemList,
  Value,
} from "@macrostrat/data-components";
import { useMacrostratDefs } from "@macrostrat/data-provider";
import h from "./age-range.module.sass";
import { formatProportion, formatRange } from "./utils";

export function AgeField({ unit, children }) {
  const [b_age, t_age, _unit] = getAgeRange(unit);

  return h(
    DataField,
    {
      label: "Age",
      value: formatRange(b_age, t_age),
      unit: _unit,
    },
    children,
  );
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

export function IntervalProportions({ unit, onClickItem }) {
  /** Display the proportions of the unit that belong to the base and top intervals, if they are different */
  if (
    unit.b_int_id == null &&
    unit.t_int_id == null &&
    unit.b_prop == null &&
    unit.t_prop == null
  )
    return null;

  const i0 = unit.b_int_id;
  const i1 = unit.t_int_id;
  let b_prop = unit.b_prop ?? 0;
  let t_prop = unit.t_prop ?? 1;

  const intervalMap = useMacrostratDefs("intervals");
  const int0 = intervalMap?.get(i0) ?? {};

  const interval0: IntervalShort = {
    ...int0,
    id: i0,
    name: unit.b_int_name,
  };

  let p0: any = null;
  const int1 = intervalMap?.get(i1) ?? {};
  const p1: any = h(Proportion, { value: t_prop });

  if (i0 !== i1 || b_prop !== 0 || t_prop !== 1) {
    // We have a single interval with undefined proportions
    p0 = h(Proportion, { value: b_prop });
  }

  if (i0 === i1 && (b_prop !== 0 || t_prop !== 1)) {
    p0 = h("span.joint-proportion", [p0, " ", h("span.sep", "to"), " ", p1]);
  }

  const clickable = onClickItem != null;

  const handleClick = (event: MouseEvent) => {
    if (onClickItem) {
      onClickItem(event, interval0);
    }
  };

  return h(ItemList, { className: "interval-proportions" }, [
    h(IntervalTag, {
      className: clickable ? "clickable" : "",
      onClick: clickable ? handleClick : undefined,
      interval: interval0,
      prefix: p0,
    }),
    h.if(i0 != i1)("span.discourage-break", [
      h("span.sep", " to "),
      h(IntervalTag, {
        className: clickable ? "clickable" : "",
        onClick: clickable ? handleClick : undefined,
        interval: {
          ...int1,
          id: i1,
          name: unit.t_int_name,
        },
        prefix: p1,
      }),
    ]),
  ]);
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
