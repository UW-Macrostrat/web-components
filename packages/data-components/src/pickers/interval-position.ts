/**
 * IntervalPositionEditor — a chronostratigraphic position: an interval and,
 * optionally, a proportion within it, from which an age follows.
 *
 * This is how the column-ingestion format records where a boundary sits in
 * time (`b_int`/`b_prop`, `t_int`/`t_prop`), and how Macrostrat's age model
 * calibrates a surface. The interval alone is a position ("in the Devonian");
 * the proportion refines it — 0 at the interval's base (its older bound), 1
 * at its top. The interval is drawn as a tag, with the position inside it
 * once there is one; the age is derived, shown in its details, and never typed.
 *
 * Selecting the tag opens the position control as a nested control, inline
 * below it (or in a popover, with `detailsMode: "popover"`): a slider with
 * *Base* and *Top* shortcuts, with a ✕ that drops the position. The ✕ after
 * the selected tag, or Delete, clears the interval.
 *
 * Intervals and timescales come from the enclosing `MacrostratDataProvider`
 * unless given as props. Matching can be **constrained to a timescale**:
 * imposed from outside (`timescale`, shown by name above the interval) or
 * chosen in the control (`timescaleChoice`). Read-only when `onChange` is
 * absent, so it doubles as the display of a calibration.
 */
import classNames from "classnames";
import { type ReactNode, useMemo, useState } from "react";
import { Button, ButtonGroup, HTMLSelect, Slider } from "@blueprintjs/core";
import {
  formatIntervalProportion,
  IntervalTag,
  type IntervalShort,
} from "../components/unit-details";
import { TagSize } from "../components/unit-details/tag";
import {
  type PickerItem,
  type TagDetailsContext,
  TagPicker,
} from "./tag-picker";
import {
  type DetailsMode,
  TagDetailsEditor,
  type TagDetailsSection,
} from "./tag-details-editor";
import { useVocabulary, type Vocabulary } from "./vocabularies";
import h from "./pickers.module.sass";

/** A timescale as `/defs/timescales` reports it (`timescale` is its name;
 * `name` is accepted too). */
export interface TimescaleRef {
  timescale_id: number;
  timescale?: string;
  name?: string;
  n_intervals?: number;
  max_age?: number;
  min_age?: number;
}

export function timescaleName(t: TimescaleRef | null | undefined): string {
  return t?.timescale ?? t?.name ?? `Timescale ${t?.timescale_id ?? "?"}`;
}

/** An interval definition, as `/defs/intervals` reports it, reduced to what
 * a position needs. `timescales` lists the timescales the interval belongs
 * to. */
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
  value: IntervalPosition | null | undefined;
  onChange?: (value: IntervalPositionChange) => void;
  /** The interval vocabulary. Defaults to the data provider's. */
  intervals?: Vocabulary<IntervalDefLike>;
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
  timescaleChoice?: boolean;
  /** The timescales offered by `timescaleChoice`. Defaults to the data
   * provider's. */
  timescales?: Vocabulary<TimescaleRef>;
  /** The timescale chosen at first (uncontrolled). */
  defaultTimescaleID?: number | null;
  /** Where the selected interval's position control opens (default
   * `inline`). */
  detailsMode?: DetailsMode;
  /** Show the derived age in the interval's tag (default): the age at the
   * position, or the interval's range while there is no position. */
  showAge?: boolean;
  /** The size of the interval's tag (default small). */
  size?: TagSize;
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
    value,
    onChange,
    proportion = true,
    defaultProportion = 0,
    timescale = null,
    timescaleChoice = false,
    defaultTimescaleID = null,
    detailsMode = "inline",
    showAge = true,
    size = TagSize.Small,
    disabled,
    className,
  } = props;

  const editable = onChange != null && !disabled;
  const defs = useVocabulary<IntervalDefLike>("intervals", props.intervals);

  // Timescales are only needed to offer a choice of them
  const offerTimescales = timescaleChoice && timescale == null;
  let timescaleSource = props.timescales;
  if (!offerTimescales) timescaleSource = null;
  const timescales = useVocabulary<TimescaleRef>("timescales", timescaleSource);

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
  const current: IntervalItem | null = useMemo(() => {
    if (value?.int_id == null) return null;
    const def = defs.find((d) => d.int_id === value.int_id);
    if (def == null) return null;
    return { id: def.int_id, name: def.name, color: def.color, def };
  }, [defs, value?.int_id]);

  const prop = value?.prop ?? null;
  const age = ageAtProportion(current?.def, prop);

  const emit = (next: Partial<IntervalPosition>) => {
    let int_id = value?.int_id ?? null;
    if (next.int_id !== undefined) int_id = next.int_id;
    let nextProp = prop;
    if (next.prop !== undefined) nextProp = next.prop;
    const def = defs.find((d) => d.int_id === int_id) ?? null;
    let int_name = def?.name ?? null;
    if (int_id === value?.int_id) int_name ??= value?.int_name ?? null;
    onChange?.({
      int_id,
      int_name,
      prop: nextProp,
      age: ageAtProportion(def, nextProp),
    });
  };

  const changePicked = (next: IntervalItem[]) => {
    if (next.length === 0) {
      // Removing the interval takes its position with it
      emit({ int_id: null, prop: null });
      return;
    }
    emit({ int_id: next[0].id as number });
  };

  const renderDetails = (ctx: TagDetailsContext<IntervalItem>) => {
    const sections: TagDetailsSection[] = [];
    if (proportion) {
      sections.push({
        key: "position",
        label: "Position in interval",
        addLabel: "Add position in interval",
        icon: "arrows-vertical",
        summary: positionSummary(prop),
        editor: h(ProportionControl, {
          prop,
          defaultProportion,
          onChange: (next) => emit({ prop: next }),
        }),
        // Dropping the position leaves the interval alone
        onRemove: () => emit({ prop: null }),
      });
    }
    // Inline, the interval's tag says what is being edited, so the panel is
    // its field alone and the interval's ✕ follows the tag
    return h(TagDetailsEditor, {
      mode: ctx.mode,
      header: ctx.mode === "popover",
      title: ctx.item.name,
      color: ctx.item.color,
      sections,
      removeLabel: "Clear interval",
      onRemove: ctx.remove,
    });
  };

  let removeButton: "details" | "tag" = "details";
  if (detailsMode === "inline") removeButton = "tag";

  let unresolved: ReactNode = null;
  if (current == null && value?.int_name != null) {
    // Until the vocabulary arrives, a name can't be told unknown
    let title = "No interval of this name is known";
    if (defs.length === 0) title = "Loading intervals…";
    unresolved = h(
      "span.unresolved-interval",
      { title, className: classNames({ loading: defs.length === 0 }) },
      value.int_name,
    );
  }

  let tagAge: number | null = null;
  if (showAge) tagAge = age;

  let picked: IntervalItem[] = [];
  if (current != null) picked = [current];

  let change: ((next: IntervalItem[]) => void) | undefined;
  if (editable) change = changePicked;

  return h(
    "div.interval-position",
    { className: classNames(className, { editable }) },
    [
      // The constraint sits above the interval: it says what the interval is
      // matched within, and is read before the interval is.
      h(TimescaleConstraint, {
        timescale,
        timescales,
        timescaleID: chosenTimescaleID,
        onChange: setChosenTimescaleID,
        editable,
      }),
      h(TagPicker<IntervalItem>, {
        items,
        value: picked,
        multi: false,
        onChange: change,
        detailsMode,
        placeholder: "Choose an interval…",
        searchPlaceholder: "Search intervals…",
        // The interval tag of the unit details panels: the position in its
        // prefix, the age in its details
        renderTag: (item) =>
          h(IntervalTag, {
            interval: toIntervalShort(item.def),
            proportion: prop,
            age: tagAge,
            showAgeRange: showAge,
            size,
            interactive: false,
          }),
        renderDetails,
        removeButton,
        trailing: unresolved,
      }),
    ],
  );
}

/* --------------------------------------------------------------- proportion */

/** The optional position within the interval. Without one: a button that
 * adds it (at the default) and shortcuts straight to the base or the top.
 * With one: a slider and the same shortcuts. Dropping it is its section's
 * ✕. */
function ProportionControl({
  prop,
  defaultProportion,
  onChange,
}: {
  prop: number | null;
  defaultProportion: number;
  onChange: (prop: number | null) => void;
}) {
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
        text: "Set a position",
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
  ]);
}

/* ---------------------------------------------------------------- timescale */

/** The timescale matching is constrained to, above the interval: a name when
 * it is imposed, a choice when a vocabulary is offered, nothing otherwise. */
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
    return h("div.timescale-row", [
      h("span.timescale-label", "Timescale"),
      h(
        "span.timescale-constraint",
        { title: "Intervals are matched within this timescale" },
        timescaleName(timescale),
      ),
    ]);
  }
  if (timescales == null || timescales.length === 0) return null;
  const chosen = timescales.find((t) => t.timescale_id === timescaleID);
  if (!editable) {
    if (chosen == null) return null;
    return h("div.timescale-row", [
      h("span.timescale-label", "Timescale"),
      h("span.timescale-constraint", timescaleName(chosen)),
    ]);
  }
  const options = [
    { label: "Any timescale", value: "" },
    ...timescales.map((t) => ({
      label: timescaleName(t),
      value: String(t.timescale_id),
    })),
  ];
  return h("div.timescale-row", [
    h("span.timescale-label", "Timescale"),
    h(HTMLSelect, {
      className: "timescale-select",
      minimal: true,
      options,
      value: timescaleID == null ? "" : String(timescaleID),
      title: "Constrain matching to a timescale",
      onChange: (evt) => {
        const raw = evt.currentTarget.value;
        onChange(raw === "" ? null : Number(raw));
      },
    }),
  ]);
}

function inTimescale(def: IntervalDefLike, timescaleID: number): boolean {
  return (def.timescales ?? []).some((t) => t.timescale_id === timescaleID);
}

function positionSummary(prop: number | null): string | null {
  if (prop == null || isNaN(prop)) return null;
  return formatIntervalProportion(prop);
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
