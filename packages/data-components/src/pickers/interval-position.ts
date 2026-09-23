/**
 * IntervalPositionEditor — a chronostratigraphic position: an interval and a
 * proportion within it, from which an age follows.
 *
 * This is how the column-ingestion format records where a boundary sits in
 * time (`b_int`/`b_prop`, `t_int`/`t_prop`), and how Macrostrat's age model
 * calibrates a surface. The age is derived — 0 is the interval's base (its
 * older bound), 1 its top — and is shown but never typed. Read-only when
 * `onChange` is absent, so it doubles as the display of a calibration.
 */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { useMemo } from "react";
import { Slider } from "@blueprintjs/core";
import { IntervalTag, type IntervalShort } from "../components/unit-details";
import { TagSize } from "../components/unit-details/tag";
import { ItemPicker, type PickerItem } from "./item-picker";
import styles from "./pickers.module.sass";

const h = hyper.styled(styles);

/** An interval definition: what `useMacrostratDefs("intervals")` holds,
 * reduced to what a position needs. */
export interface IntervalDefLike {
  int_id: number;
  name: string;
  b_age: number;
  t_age: number;
  color?: string;
  rank?: number;
  int_type?: string;
}

export interface IntervalPosition {
  int_id: number | null;
  int_name?: string | null;
  /** 0 at the interval's base, 1 at its top. */
  prop: number | null;
}

export interface IntervalPositionChange extends IntervalPosition {
  /** The age the interval and proportion work out to, when both are known. */
  age: number | null;
}

export interface IntervalPositionEditorProps {
  intervals: IntervalDefLike[] | Map<number, IntervalDefLike> | null | undefined;
  value: IntervalPosition | null | undefined;
  onChange?: (value: IntervalPositionChange) => void;
  /** Show the derived age (default). */
  showAge?: boolean;
  disabled?: boolean;
  className?: string;
}

/** The age at a proportion of an interval: base at 0, top at 1. */
export function ageAtProportion(
  interval: { b_age: number; t_age: number } | null | undefined,
  prop: number | null | undefined,
): number | null {
  if (interval == null || prop == null || isNaN(prop)) return null;
  const span = interval.b_age - interval.t_age;
  if (!(span > 0)) return null;
  return interval.b_age - prop * span;
}

type IntervalItem = PickerItem & { def: IntervalDefLike };

export function IntervalPositionEditor(props: IntervalPositionEditorProps) {
  const {
    intervals,
    value,
    onChange,
    showAge = true,
    disabled,
    className,
  } = props;

  const defs = useMemo(() => toArray(intervals), [intervals]);
  const items: IntervalItem[] = useMemo(
    () =>
      [...defs]
        .sort((a, b) => b.b_age - a.b_age)
        .map((def) => ({
          id: def.int_id,
          name: def.name,
          color: def.color,
          description: `${formatAge(def.b_age)}–${formatAge(def.t_age)} Ma`,
          def,
        })),
    [defs],
  );

  const current = useMemo(() => {
    if (value?.int_id == null) return null;
    return items.find((d) => d.id === value.int_id) ?? null;
  }, [items, value?.int_id]);

  const prop = value?.prop ?? null;
  const age = ageAtProportion(current?.def, prop);
  const editable = onChange != null && !disabled;

  const emit = (next: Partial<IntervalPosition>) => {
    const int_id = next.int_id !== undefined ? next.int_id : (value?.int_id ?? null);
    const def = defs.find((d) => d.int_id === int_id) ?? null;
    const nextProp = next.prop !== undefined ? next.prop : prop;
    onChange?.({
      int_id,
      int_name: def?.name ?? value?.int_name ?? null,
      prop: nextProp,
      age: ageAtProportion(def, nextProp),
    });
  };

  const picker = h(ItemPicker<IntervalItem>, {
    items,
    value: current == null ? [] : [current],
    multi: false,
    onChange: editable ? (next) => emit({ int_id: next[0]?.id as number }) : undefined,
    placeholder: "Choose an interval…",
    searchPlaceholder: "Search intervals…",
    renderTag: (item) =>
      h(IntervalTag, {
        interval: toIntervalShort(item.def),
        size: TagSize.Small,
      }),
  });

  let unresolved = null;
  if (current == null && value?.int_name != null) {
    unresolved = h(
      "span.unresolved-interval",
      { title: "No interval of this name is known" },
      value.int_name,
    );
  }

  let proportion = null;
  if (current != null) {
    if (editable) {
      proportion = h(Slider, {
        className: "proportion-slider",
        min: 0,
        max: 1,
        stepSize: 0.01,
        labelStepSize: 0.5,
        labelRenderer: (v) => `${Math.round(v * 100)}%`,
        value: prop ?? 0,
        onChange: (v) => emit({ prop: v }),
        disabled,
      });
    } else if (prop != null) {
      proportion = h("span.proportion-value", `${Math.round(prop * 100)}%`);
    }
  }

  let ageLabel = null;
  if (showAge && age != null) {
    ageLabel = h("span.derived-age", [formatAge(age), " Ma"]);
  }

  return h(
    "div.interval-position",
    { className: classNames(className, { editable }) },
    [
      h("div.interval-row", [picker, unresolved, ageLabel]),
      h.if(proportion != null)("div.proportion-row", proportion),
    ],
  );
}

function toIntervalShort(def: IntervalDefLike): IntervalShort {
  return {
    id: def.int_id,
    name: def.name,
    b_age: def.b_age,
    t_age: def.t_age,
    color: def.color ?? "#888",
    rank: def.rank ?? 0,
  };
}

function formatAge(age: number): string {
  if (age >= 100) return age.toFixed(0);
  if (age >= 10) return age.toFixed(1);
  return age.toFixed(2);
}

function toArray<T>(source: T[] | Map<any, T> | null | undefined): T[] {
  if (source == null) return [];
  if (Array.isArray(source)) return source;
  return Array.from(source.values());
}
