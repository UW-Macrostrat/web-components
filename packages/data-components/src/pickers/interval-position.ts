/**
 * IntervalPositionEditor — a chronostratigraphic position: an interval and,
 * optionally, a proportion within it, from which an age follows.
 *
 * This is how the column-ingestion format records where a boundary sits in
 * time (`b_int`/`b_prop`, `t_int`/`t_prop`), and how Macrostrat's age model
 * calibrates a surface. The interval alone is a position ("in the Devonian");
 * the proportion is an add-on that refines it — 0 at the interval's base (its
 * older bound), 1 at its top — added with a button and slid, with *Base* and
 * *Top* shortcuts. The age is derived and never typed.
 *
 * Matching can be **constrained to a timescale**: either a timescale is
 * imposed from outside (`timescale`, shown by name) or the vocabulary of
 * timescales is offered (`timescales`) and one is chosen in the control.
 * Read-only when `onChange` is absent, so it doubles as the display of a
 * calibration.
 */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { type ReactNode, useMemo, useState } from "react";
import { Button, ButtonGroup, HTMLSelect, Slider } from "@blueprintjs/core";
import { IntervalTag, type IntervalShort } from "../components/unit-details";
import { TagSize } from "../components/unit-details/tag";
import { ItemPicker, type PickerItem } from "./item-picker";
import styles from "./pickers.module.sass";

const h = hyper.styled(styles);

export interface TimescaleRef {
  timescale_id: number;
  name: string;
}

/** An interval definition: what `useMacrostratDefs("intervals")` holds,
 * reduced to what a position needs. `timescales` lists the timescales the
 * interval belongs to, when the source reports them. */
export interface IntervalDefLike {
  int_id: number;
  name: string;
  b_age: number;
  t_age: number;
  color?: string;
  rank?: number;
  int_type?: string;
  timescales?: TimescaleRef[];
}

export interface IntervalPosition {
  int_id: number | null;
  int_name?: string | null;
  /** 0 at the interval's base, 1 at its top; `null` when the position is the
   * interval alone. */
  prop: number | null;
}

export interface IntervalPositionChange extends IntervalPosition {
  /** The age the interval and proportion work out to, when both are known. */
  age: number | null;
}

export interface IntervalPositionEditorProps {
  intervals:
    IntervalDefLike[] | Map<number, IntervalDefLike> | null | undefined;
  value: IntervalPosition | null | undefined;
  onChange?: (value: IntervalPositionChange) => void;
  /** Whether the proportion within the interval can be set at all. Off, the
   * position is the interval alone. */
  proportion?: boolean;
  /** The proportion a position starts at when one is added (default 0, the
   * interval's base). */
  defaultProportion?: number;
  /** Constrain matching to this timescale, from outside: only its intervals
   * are offered, and it is shown by name. */
  timescale?: TimescaleRef | null;
  /** Offer a choice of timescale in the control. Ignored when `timescale` is
   * imposed. */
  timescales?: TimescaleRef[] | null;
  /** The timescale chosen from `timescales` at first (uncontrolled). */
  defaultTimescaleID?: number | null;
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
    proportion = true,
    defaultProportion = 0,
    timescale = null,
    timescales = null,
    defaultTimescaleID = null,
    showAge = true,
    disabled,
    className,
  } = props;

  const editable = onChange != null && !disabled;
  const defs = useMemo(() => toArray(intervals), [intervals]);

  // The timescale in force: imposed, else the one chosen here
  const [chosenTimescaleID, setChosenTimescaleID] = useState<number | null>(
    defaultTimescaleID,
  );
  const timescaleID = timescale?.timescale_id ?? chosenTimescaleID;

  const items: IntervalItem[] = useMemo(() => {
    let list = defs;
    if (timescaleID != null) {
      list = defs.filter((d) => inTimescale(d, timescaleID));
    }
    return [...list]
      .sort((a, b) => b.b_age - a.b_age)
      .map((def) => ({
        id: def.int_id,
        name: def.name,
        color: def.color,
        description: `${formatAge(def.b_age)}–${formatAge(def.t_age)} Ma`,
        def,
      }));
  }, [defs, timescaleID]);

  // The current interval is looked up in the whole vocabulary: a constraint
  // narrows what can be picked, not what is already there.
  const current = useMemo(() => {
    if (value?.int_id == null) return null;
    const def = defs.find((d) => d.int_id === value.int_id);
    if (def == null) return null;
    return { id: def.int_id, name: def.name, color: def.color, def };
  }, [defs, value?.int_id]);

  const prop = value?.prop ?? null;
  const age = ageAtProportion(current?.def, prop);

  const emit = (next: Partial<IntervalPosition>) => {
    const int_id =
      next.int_id !== undefined ? next.int_id : (value?.int_id ?? null);
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
    onChange: editable
      ? (next) => emit({ int_id: (next[0]?.id as number) ?? null })
      : undefined,
    placeholder: "Choose an interval…",
    searchPlaceholder: "Search intervals…",
    renderTag: (item) =>
      h(IntervalTag, {
        interval: toIntervalShort(item.def),
        size: TagSize.Small,
      }),
  });

  let unresolved: ReactNode = null;
  if (current == null && value?.int_name != null) {
    unresolved = h(
      "span.unresolved-interval",
      { title: "No interval of this name is known" },
      value.int_name,
    );
  }

  let ageLabel: ReactNode = null;
  if (showAge && age != null) {
    ageLabel = h("span.derived-age", [formatAge(age), " Ma"]);
  } else if (showAge && current != null && prop == null) {
    ageLabel = h(
      "span.derived-age",
      `${formatAge(current.def.b_age)}–${formatAge(current.def.t_age)} Ma`,
    );
  }

  let proportionRow: ReactNode = null;
  if (proportion && current != null) {
    proportionRow = h(ProportionControl, {
      prop,
      editable,
      defaultProportion,
      onChange: (next) => emit({ prop: next }),
    });
  }

  return h(
    "div.interval-position",
    { className: classNames(className, { editable }) },
    [
      h("div.interval-row", [
        h(TimescaleConstraint, {
          timescale,
          timescales,
          timescaleID: chosenTimescaleID,
          onChange: setChosenTimescaleID,
          editable,
        }),
        picker,
        unresolved,
        ageLabel,
      ]),
      proportionRow,
    ],
  );
}

/* --------------------------------------------------------------- proportion */

/** The optional position within the interval. Without one: a button that
 * adds it (at the default) and shortcuts straight to the base or the top.
 * With one: a slider, the same shortcuts, and a way to drop it again. */
function ProportionControl({
  prop,
  editable,
  defaultProportion,
  onChange,
}: {
  prop: number | null;
  editable: boolean;
  defaultProportion: number;
  onChange: (prop: number | null) => void;
}) {
  if (!editable) {
    if (prop == null) return null;
    return h(
      "div.proportion-row",
      h("span.proportion-value", `${Math.round(prop * 100)}% up the interval`),
    );
  }

  const shortcuts = h(
    ButtonGroup,
    { minimal: true, className: "proportion-shortcuts" },
    [
      h(Button, {
        small: true,
        text: "Base",
        active: prop === 0,
        title: "At the interval's base (0)",
        onClick: () => onChange(0),
      }),
      h(Button, {
        small: true,
        text: "Top",
        active: prop === 1,
        title: "At the interval's top (1)",
        onClick: () => onChange(1),
      }),
    ],
  );

  if (prop == null) {
    return h("div.proportion-row.proportion-absent", [
      h(Button, {
        small: true,
        minimal: true,
        icon: "small-plus",
        text: "Position in interval",
        title: "Refine the position to a proportion of the interval",
        onClick: () => onChange(defaultProportion),
      }),
      shortcuts,
    ]);
  }

  return h("div.proportion-row", [
    h(Slider, {
      className: "proportion-slider",
      min: 0,
      max: 1,
      stepSize: 0.01,
      labelStepSize: 0.5,
      labelRenderer: (v) => `${Math.round(v * 100)}%`,
      value: prop,
      onChange: (v) => onChange(v),
    }),
    shortcuts,
    h(Button, {
      small: true,
      minimal: true,
      icon: "small-cross",
      title: "Drop the proportion: the position is the interval alone",
      onClick: () => onChange(null),
    }),
  ]);
}

/* ---------------------------------------------------------------- timescale */

/** The timescale matching is constrained to: a name when it is imposed, a
 * choice when a vocabulary is offered, nothing otherwise. */
function TimescaleConstraint({
  timescale,
  timescales,
  timescaleID,
  onChange,
  editable,
}: {
  timescale: TimescaleRef | null;
  timescales: TimescaleRef[] | null;
  timescaleID: number | null;
  onChange: (id: number | null) => void;
  editable: boolean;
}) {
  if (timescale != null) {
    return h(
      "span.timescale-constraint",
      { title: "Intervals are matched within this timescale" },
      timescale.name,
    );
  }
  if (timescales == null || timescales.length === 0 || !editable) return null;
  const options = [
    { label: "Any timescale", value: "" },
    ...timescales.map((t) => ({
      label: t.name,
      value: String(t.timescale_id),
    })),
  ];
  return h(HTMLSelect, {
    className: "timescale-select",
    minimal: true,
    options,
    value: timescaleID == null ? "" : String(timescaleID),
    title: "Constrain matching to a timescale",
    onChange: (evt) => {
      const raw = evt.currentTarget.value;
      onChange(raw === "" ? null : Number(raw));
    },
  });
}

function inTimescale(def: IntervalDefLike, timescaleID: number): boolean {
  return (def.timescales ?? []).some((t) => t.timescale_id === timescaleID);
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
