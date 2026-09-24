/**
 * Proportions of a unit's lithologies: set as a number, as a term from a
 * vocabulary of abundances ("major", "minor", "trace"…), or both, and
 * resolved to a composition that sums to one.
 *
 * A term carries an `id` (passed through untouched, so a term round-trips to
 * whatever table it came from), a `name` to show, and optionally the
 * proportion it implies (`value`) and its `weight` against other terms when
 * the composition is resolved. Macrostrat's own vocabulary is the two terms
 * of `unit_liths.dom` — `dom` and `sub` — which its backend weights five to
 * one when it computes `comp_prop`; `resolveLithologyProportions` does the
 * same, taking any numerical proportions as given.
 */
import { type ReactNode } from "react";
import { Button, NumericInput } from "@blueprintjs/core";
import classNames from "classnames";
import h from "./pickers.module.sass";

export interface ProportionTerm {
  /** Carried through to the output untouched. */
  id: string | number;
  name: string;
  /** The proportion (0–1) the term implies, if it implies one. */
  value?: number | null;
  /** Its weight against other terms when a composition is resolved
   * (default 1). */
  weight?: number;
}

/** Macrostrat's dominant/subordinate split (`unit_liths.dom`), weighted as
 * its backend weights them in computing `comp_prop`. */
export const macrostratProportionTerms: ProportionTerm[] = [
  { id: "dom", name: "major", weight: 5 },
  { id: "sub", name: "minor", weight: 1 },
];

/** The National Geologic Synthesis abundance vocabulary
 * (`vocabularies_proportiondict`), most abundant first. Only "all" implies a
 * number; the rest are weighted in the two tiers the NGS integration draws —
 * the terms that go unstated in a unit's lithology text, and the ones that
 * qualify a subordinate lithology — as `dom` and `sub`. Ids are the terms. */
export const ngsProportionTerms: ProportionTerm[] = [
  { id: "all", name: "all", value: 1, weight: 5 },
  { id: "major", name: "major", weight: 5 },
  { id: "more than half", name: "more than half", weight: 5 },
  { id: "most abundant", name: "most abundant", weight: 5 },
  { id: "present", name: "present", weight: 5 },
  { id: "variable", name: "variable", weight: 1 },
  { id: "less than half", name: "less than half", weight: 1 },
  { id: "minor", name: "minor", weight: 1 },
  { id: "rare", name: "rare", weight: 1 },
  { id: "trace", name: "trace", weight: 1 },
];

/** How a proportion may be set. */
export interface ProportionOptions {
  /** Allow a percentage to be typed (default). */
  numeric?: boolean;
  /** Terms to choose from, alongside a percentage or instead of one. */
  terms?: ProportionTerm[] | null;
  /** Whether a proportion, once set, can be cleared again (default): the ✕
   * on the proportion's section, and a blank percentage. */
  clearable?: boolean;
}

/** A proportion as set: a number (0–1), a term, or both — a term that
 * implies a value sets the number too. */
export interface ProportionValue {
  prop: number | null;
  term: ProportionTerm | null;
}

/** Normalize `true` / `false` / options to options; `null` when proportions
 * can't be set at all. */
export function proportionOptions(
  options: boolean | ProportionOptions | null | undefined,
): Required<ProportionOptions> | null {
  if (options === false || options == null) return null;
  if (options === true) return { numeric: true, terms: [], clearable: true };
  return {
    numeric: options.numeric ?? true,
    terms: options.terms ?? [],
    clearable: options.clearable ?? true,
  };
}

/** A proportion as words: the term's name when there is one, else a
 * percent. */
export function proportionLabel(value: ProportionValue): string | null {
  if (value.term != null) return value.term.name;
  if (value.prop != null) return `${Math.round(value.prop * 100)}%`;
  return null;
}

/** Set a proportion: a percentage, if allowed, and a choice of terms, if any
 * are offered. Picking a term sets the number it implies; typing a number
 * sets the number alone. Clearing it is its section's ✕ (or, when
 * `clearable`, blanking the percentage). */
export function ProportionEditor({
  value,
  onChange,
  options,
  autoFocus = false,
}: {
  value: ProportionValue;
  onChange: (value: ProportionValue) => void;
  options: ProportionOptions;
  autoFocus?: boolean;
}) {
  const { numeric = true, terms = [], clearable = true } = options;
  const { prop, term } = value;

  let numberInput: ReactNode = null;
  if (numeric) {
    numberInput = h(PercentInput, {
      value: prop,
      // Focus the number only when it is the whole editor
      autoFocus: autoFocus && (terms ?? []).length === 0,
      clearable,
      onChange: (next) => onChange({ prop: next, term: null }),
    });
  }

  let termButtons: ReactNode = null;
  if (terms != null && terms.length > 0) {
    termButtons = h(
      "div.proportion-terms",
      terms.map((d) => {
        const active = term?.id === d.id;
        return h(Button, {
          key: d.id,
          small: true,
          active,
          text: d.name,
          className: classNames("proportion-term", { active }),
          onClick() {
            if (active) return;
            onChange({ prop: d.value ?? null, term: d });
          },
        });
      }),
    );
  }

  return h("div.proportion-editor", [numberInput, termButtons]);
}

/** A whole percent, stored as a proportion (0–1). */
function PercentInput({
  value,
  onChange,
  autoFocus,
  clearable,
}: {
  value: number | null;
  onChange: (prop: number | null) => void;
  autoFocus: boolean;
  clearable: boolean;
}) {
  let text = "";
  if (value != null) text = String(Math.round(value * 100));

  return h(NumericInput, {
    className: "proportion-input",
    small: true,
    min: 0,
    max: 100,
    stepSize: 5,
    minorStepSize: 1,
    clampValueOnBlur: true,
    allowNumericCharactersOnly: true,
    placeholder: "Equal parts",
    value: text,
    autoFocus,
    rightElement: h("span.percent-sign", "%"),
    onValueChange(pct: number, raw: string) {
      if (raw.trim() === "") {
        if (clearable && value != null) onChange(null);
        return;
      }
      if (isNaN(pct)) return;
      const prop = Math.min(Math.max(pct, 0), 100) / 100;
      if (prop !== value) onChange(prop);
    },
  });
}

/* ---------------------------------------------------------------- resolving */

/** Anything with a proportion as set: a number, a term, or neither. */
export interface ProportionedEntry {
  prop?: number | null;
  prop_term?: ProportionTerm | null;
  /** The resolved share of the whole (0–1), as `unit_liths.comp_prop`. */
  comp_prop?: number | null;
}

/** Resolve a set of proportions to shares that sum to one, as Macrostrat's
 * backend computes `comp_prop`.
 *
 * Numerical proportions (typed, or implied by a term) are taken as given.
 * What they leave is shared among the rest by their terms' weights — so
 * `dom` against `sub` is five to one — and entries with neither a number
 * nor a term weigh 1, which makes a set of bare lithologies equal parts.
 * Numbers that already sum past one are scaled back to one, and leave the
 * rest nothing. */
export function resolveLithologyProportions<T extends ProportionedEntry>(
  entries: T[],
): T[] {
  let fixedTotal = 0;
  let weightTotal = 0;
  for (const d of entries) {
    if (d.prop != null) {
      fixedTotal += d.prop;
    } else {
      weightTotal += d.prop_term?.weight ?? 1;
    }
  }

  // With nothing left to weigh, the numbers alone make up the whole
  let fixedScale = 1;
  if (fixedTotal > 1 || (weightTotal === 0 && fixedTotal > 0)) {
    fixedScale = 1 / fixedTotal;
  }
  const remainder = Math.max(0, 1 - fixedTotal * fixedScale);

  return entries.map((d) => {
    let comp_prop: number;
    if (d.prop != null) {
      comp_prop = d.prop * fixedScale;
    } else {
      comp_prop = (remainder * (d.prop_term?.weight ?? 1)) / weightTotal;
    }
    return { ...d, comp_prop };
  });
}
