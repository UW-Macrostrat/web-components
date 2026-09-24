/**
 * LithologyPicker — a unit's lithologies, as the same `LithologyTag`s the
 * details panels use, so a lithology reads the same whether it is being
 * looked at or changed.
 *
 * Its vocabularies come from the enclosing `MacrostratDataProvider` unless
 * given as props (see `vocabularies.ts`), and it hands back the unit's own
 * array shape (`UnitLithology[]`), so a value round-trips without
 * translation.
 *
 * Selecting a lithology opens its details editor — a menu to add a
 * proportion, add attributes (`lith_atts`: grain size, bedforms, colour…)
 * or remove it, or, with `detailsMode: "inline"`, the same fields laid out
 * below the picker. The proportion and attributes are then drawn on the tag
 * itself.
 *
 * A proportion is a percentage, a term from a vocabulary of abundances
 * (`proportions: { terms }` — Macrostrat's major/minor, the NGS list…), or
 * both, and the tag shows the term when there is one. With
 * `resolveProportions`, every change also carries each lithology's share of
 * the whole (`comp_prop`), summed to one as Macrostrat's backend does it.
 *
 * Over several units at once, pass their lists as `values` (and take
 * `onChangeValues`): the picker shows what they hold between them, faded
 * where only some hold a lithology, and edits each unit's own list — see
 * `multi-values.ts`.
 */
import { useMemo } from "react";
import type { UnitLithology } from "@macrostrat/api-types";
import { LithologyTag, LithologyTagFeature } from "../components/unit-details";
import { Tag, TagSize } from "../components/unit-details/tag";
import {
  type PickerItem,
  type TagDetailsContext,
  TagPicker,
  VocabularyList,
} from "./tag-picker";
import {
  type DetailsMode,
  TagDetailsEditor,
  type TagDetailsSection,
} from "./tag-details-editor";
import { useVocabulary, type Vocabulary } from "./vocabularies";
import {
  addToAll,
  applyUnionChange,
  type CombinedValues,
  combineValues,
  type MergedItem,
  type MergeItems,
  mergeLists,
  updateInEach,
} from "./multi-values";
import type { SelectionColor } from "./selection-colors";
import {
  type ProportionOptions,
  ProportionEditor,
  proportionLabel,
  proportionOptions,
  type ProportionTerm,
  resolveLithologyProportions,
} from "./proportions";
import h from "./pickers.module.sass";

/** A lithology definition, as `/defs/lithologies` reports it. */
export interface LithologyDef {
  lith_id: number;
  name: string;
  color?: string;
  type?: string;
  class?: string;
  group?: string | null;
}

/** A lithology attribute definition, as `/defs/lithology_attributes`
 * reports it. */
export interface LithAttributeDef {
  lith_att_id: number;
  name: string;
  /** What kind of attribute: `grains`, `bedform`, `sed structure`… */
  type?: string;
  /** Total units carrying it, when the source reports it. */
  t_units?: number;
}

/** A unit's lithology entry: the definition's id and name, with the unit's
 * own proportion and attributes (attribute names, as the API carries them). */
export type UnitLithologyValue = Pick<UnitLithology, "lith_id" | "name"> &
  Omit<Partial<UnitLithology>, "prop"> & {
    /** 0–1, as set or implied by `prop_term`; absent or null when there is no
     * number. */
    prop?: number | null;
    /** The abundance term the proportion was set as. */
    prop_term?: ProportionTerm | null;
    /** The share of the whole, resolved from every lithology's proportion
     * (with `resolveProportions`). */
    comp_prop?: number | null;
    color?: string;
  };

/** Turns the lithologies as set into their shares of the whole. */
export type ProportionResolver = (
  value: UnitLithologyValue[],
) => UnitLithologyValue[];

type LithItem = PickerItem & { def: LithologyDef; entry?: UnitLithologyValue };

export interface LithologyPickerProps {
  value: UnitLithologyValue[] | null | undefined;
  onChange?: (value: UnitLithologyValue[]) => void;
  /** Several units' lithologies at once, in place of `value`. */
  values?: UnitLithologyValue[][] | null;
  /** Every unit's lithologies after a change, aligned with `values`. */
  onChangeValues?: (values: UnitLithologyValue[][]) => void;
  /** Merge the entries several units hold for one lithology. Defaults to
   * `mergeLithologies`: attributes as their union, those only some hold
   * partial, and a proportion that differs "mixed". */
  mergeItems?: MergeItems<UnitLithologyValue>;
  /** The lithology vocabulary. Defaults to the data provider's. */
  lithologies?: Vocabulary<LithologyDef>;
  /** The attribute vocabulary. Defaults to the data provider's. */
  lithAttributes?: Vocabulary<LithAttributeDef>;
  /** Whether and how each lithology's proportion can be set: `true` (the
   * default) for a percentage, or options naming a vocabulary of terms and
   * whether a percentage is allowed too. */
  proportions?: boolean | ProportionOptions;
  /** Resolve every lithology's share of the whole (`comp_prop`) on each
   * change: `true` for `resolveLithologyProportions`, or a resolver of your
   * own. */
  resolveProportions?: boolean | ProportionResolver;
  /** The size of the tags (default small). */
  size?: TagSize;
  /** Whether each lithology's attributes can be set (default). */
  attributes?: boolean;
  /** Where a selected lithology's editor opens (default `popover`). */
  detailsMode?: DetailsMode;
  /** Whether lithologies can be removed (default). */
  removable?: boolean;
  disabled?: boolean;
  className?: string;
}

const tagFeatures = new Set([
  LithologyTagFeature.Attributes,
  LithologyTagFeature.Proportion,
]);

export function LithologyPicker(props: LithologyPickerProps) {
  const {
    value,
    onChange,
    values = null,
    onChangeValues,
    mergeItems = mergeLithologies,
    attributes = true,
    detailsMode = "popover",
    removable = true,
    size = TagSize.Small,
    disabled,
    className,
  } = props;

  const proportions = proportionOptions(props.proportions ?? true);
  let resolve: ProportionResolver | null = null;
  if (props.resolveProportions === true) {
    resolve = resolveLithologyProportions;
  } else if (typeof props.resolveProportions === "function") {
    resolve = props.resolveProportions;
  }

  const defs = useVocabulary<LithologyDef>("lithologies", props.lithologies);
  // Attributes switched off need no vocabulary, so none is fetched
  let attributeSource = props.lithAttributes;
  if (!attributes) attributeSource = null;
  const attributeDefs = useVocabulary<LithAttributeDef>(
    "lithAttributes",
    attributeSource,
  );

  const byID = useMemo(() => new Map(defs.map((d) => [d.lith_id, d])), [defs]);

  const items: LithItem[] = useMemo(
    () =>
      defs.map((def) => ({
        id: def.lith_id,
        name: def.name,
        color: def.color,
        description: [def.class, def.type].filter(Boolean).join(" · "),
        def,
      })),
    [defs],
  );

  // Over several units, what they hold between them
  const combined = useMemo(() => {
    if (values == null) return null;
    return combineValues(values, lithID, mergeItems);
  }, [values, mergeItems]);
  let current: UnitLithologyValue[] = value ?? [];
  if (combined != null) current = combined.union;

  // The value as picker items, carrying the unit's own entry so a change can
  // give it back unaltered.
  const picked: LithItem[] = useMemo(
    () =>
      current.map((entry) => {
        const def = byID.get(entry.lith_id);
        return {
          id: entry.lith_id,
          name: entry.name ?? def?.name ?? `#${entry.lith_id}`,
          color: entry.color ?? def?.color,
          def: def ?? { lith_id: entry.lith_id, name: entry.name },
          entry,
        };
      }),
    [current, byID],
  );

  let canChange = onChange != null;
  if (values != null) canChange = onChangeValues != null;
  const editable = canChange && !disabled;

  const commit = (next: UnitLithologyValue[]) => {
    if (resolve != null) {
      onChange?.(resolve(next));
      return;
    }
    onChange?.(next);
  };

  // Every unit's own list, each resolved on its own
  const commitEach = (next: UnitLithologyValue[][]) => {
    if (resolve != null) {
      onChangeValues?.(next.map(resolve));
      return;
    }
    onChangeValues?.(next);
  };

  const emit = (next: LithItem[]) => {
    const entries = next.map(entryOf);
    if (values != null && combined != null) {
      commitEach(applyUnionChange(values, lithID, combined.union, entries));
      return;
    }
    commit(entries);
  };

  const updateEntry = (lith_id: number, patch: Partial<UnitLithologyValue>) => {
    if (values != null) {
      commitEach(
        updateInEach(values, lithID, lith_id, (d) => ({ ...d, ...patch })),
      );
      return;
    }
    commit(
      current.map((entry) =>
        entry.lith_id === lith_id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const applyToAll = (item: LithItem) => {
    if (values == null) return;
    commitEach(addToAll(values, lithID, entryOf(item)));
  };

  // A lithology's attributes: over several units, a change to the merged
  // list is made to each unit's own list
  const setAttributes = (lith_id: number, next: string[]) => {
    if (values == null || combined == null) {
      updateEntry(lith_id, { atts: next });
      return;
    }
    const prev = combined.merged.get(lith_id)?.value.atts ?? [];
    commitEach(
      updateInEach(values, lithID, lith_id, (d) => ({
        ...d,
        atts: applyUnionChange([d.atts ?? []], attID, prev, next)[0],
      })),
    );
  };

  const applyAttributeToAll = (lith_id: number, att: string) => {
    if (values == null) return;
    commitEach(
      updateInEach(values, lithID, lith_id, (d) => ({
        ...d,
        atts: addToAll([d.atts ?? []], attID, att)[0],
      })),
    );
  };

  const renderDetails = (ctx: TagDetailsContext<LithItem>) => {
    const entry = ctx.item.entry;
    if (entry == null) return null;
    const merged = combined?.merged.get(entry.lith_id);
    const mixedProportion = merged?.mixed?.has("prop") ?? false;
    const sections: TagDetailsSection[] = [];
    if (proportions != null) {
      const current = proportionOf(entry);
      let summary: string | null = proportionLabel(current);
      if (mixedProportion) summary = "Mixed";
      let clearProportion: (() => void) | undefined;
      if (proportions.clearable) {
        clearProportion = () =>
          updateEntry(entry.lith_id, { prop: null, prop_term: null });
      }
      sections.push({
        key: "proportion",
        label: "Proportion",
        addLabel: "Add proportion",
        icon: "percentage",
        summary,
        editor: h(ProportionEditor, {
          value: current,
          options: proportions,
          autoFocus: ctx.mode !== "inline",
          onChange: ({ prop, term }) =>
            updateEntry(entry.lith_id, { prop, prop_term: term }),
        }),
        onRemove: clearProportion,
      });
    }
    if (attributes) {
      const atts = entry.atts ?? [];
      let summary: string | null = null;
      if (atts.length > 0) summary = atts.join(", ");
      sections.push({
        key: "attributes",
        label: "Attributes",
        addLabel: "Add attributes",
        icon: "tag",
        summary,
        editor: h(AttributeEditor, {
          options: attributeDefs,
          value: atts,
          partial: merged?.partial?.atts,
          mode: ctx.mode,
          color: ctx.item.color,
          onChange: (next) => setAttributes(entry.lith_id, next),
          onApplyToAll: (att) => applyAttributeToAll(entry.lith_id, att),
        }),
        onRemove: () => updateEntry(entry.lith_id, { atts: [] }),
      });
    }
    return h(TagDetailsEditor, {
      mode: ctx.mode,
      title: entry.name,
      color: ctx.item.color,
      sections,
      onRemove: ctx.remove,
      onApplyToAll: ctx.applyToAll,
      onBack: ctx.back,
    });
  };

  // With nothing to edit, a selected lithology offers only its ✕
  let details: typeof renderDetails | undefined;
  if (proportions != null || attributes) details = renderDetails;

  return h(TagPicker<LithItem>, {
    className,
    items,
    value: picked,
    onChange: editable ? emit : undefined,
    disabled,
    detailsMode,
    removable,
    size,
    partial: combined?.partial,
    onApplyToAll: applyToAll,
    placeholder: "Add lithology",
    searchPlaceholder: "Search lithologies…",
    renderTag: (item) =>
      h(LithologyTag, {
        data: { ...item.def, ...(item.entry ?? {}) } as any,
        features: tagFeatures,
        proportionLabel: tagProportionLabel(item, combined),
        size,
        interactive: false,
      }),
    renderDetails: details,
  });
}

/* --------------------------------------------------------------- attributes */

type AttributeItem = PickerItem & { def?: LithAttributeDef };

/** The attributes of one lithology, stored by name as the API carries them.
 * In a popover, the attribute vocabulary as a searchable list, the ones on
 * the lithology in bold, in its colours, and listed first; inline, those
 * attributes as tags of their own, with a list to add more. Over several
 * units, the attributes only some hold are `partial`: faded, and applied to
 * all by a click in the list or "Apply to all" on the tag. */
export function AttributeEditor({
  options,
  value,
  onChange,
  partial = null,
  onApplyToAll,
  mode = "popover",
  color,
}: {
  /** The attribute vocabulary. */
  options: LithAttributeDef[];
  /** The attribute names on the lithology. */
  value: string[];
  onChange: (atts: string[]) => void;
  /** The attributes only some of the units hold. */
  partial?: Set<string | number> | null;
  /** Give an attribute to every unit. */
  onApplyToAll?: (att: string) => void;
  mode?: DetailsMode;
  /** The lithology's colour, which the chosen attributes are drawn in. */
  color?: SelectionColor;
}) {
  const items: AttributeItem[] = useMemo(
    () =>
      [...options]
        .sort(
          (a, b) =>
            (a.type ?? "").localeCompare(b.type ?? "") ||
            a.name.localeCompare(b.name),
        )
        .map((def) => ({
          id: def.name,
          name: def.name,
          description: def.type,
          def,
        })),
    [options],
  );
  const chosen = useMemo(() => new Set<string | number>(value), [value]);

  if (mode === "inline") {
    const picked: AttributeItem[] = value.map((name) => {
      const item = items.find((d) => d.id === name);
      return item ?? { id: name, name };
    });
    return h(TagPicker<AttributeItem>, {
      className: "attribute-editor",
      items,
      value: picked,
      onChange: (next) => onChange(next.map((d) => d.name)),
      partial,
      onApplyToAll: (item) => onApplyToAll?.(item.name),
      placeholder: "Add attribute",
      selectionColor: color,
      searchPlaceholder: "Search attributes…",
      renderTag: (item) => h(Tag, { name: item.name, size: TagSize.Small }),
    });
  }

  const onPick = (item: AttributeItem) => {
    // A partial attribute is promoted to every unit; a full one is removed
    if (partial?.has(item.id) && onApplyToAll != null) {
      onApplyToAll(item.name);
      return;
    }
    if (chosen.has(item.id)) {
      onChange(value.filter((name) => name !== item.name));
      return;
    }
    onChange([...value, item.name]);
  };

  // The lithology's own attributes first, so they can be seen and taken off
  const compareItems = (a: AttributeItem, b: AttributeItem) =>
    Number(chosen.has(b.id)) - Number(chosen.has(a.id));

  return h(VocabularyList<AttributeItem>, {
    items,
    chosen,
    multi: true,
    onPick,
    compareItems,
    partial,
    selectionColor: color,
    searchPlaceholder: "Search attributes…",
  });
}

function lithID(entry: UnitLithologyValue) {
  return entry.lith_id;
}

function attID(att: string) {
  return att;
}

/** What the tag shows for a proportion: "mixed" where the units differ, a
 * term by name, else (absent) the percentage. */
function tagProportionLabel(
  item: LithItem,
  combined: CombinedValues<UnitLithologyValue> | null,
): string | undefined {
  if (combined?.merged.get(item.id)?.mixed?.has("prop")) return "mixed";
  return item.entry?.prop_term?.name;
}

/** The default merge for lithologies over several units: attributes as the
 * union of the units' (those only some hold partial), and a proportion — as
 * a number or a term — cleared and marked mixed where the units differ. */
export function mergeLithologies(
  entries: UnitLithologyValue[],
): MergedItem<UnitLithologyValue> {
  const first = entries[0];
  const atts = mergeLists(entries.map((d) => d.atts));
  const proportionToken = (d: UnitLithologyValue) =>
    JSON.stringify([d.prop ?? null, d.prop_term?.id ?? null]);
  const firstProportion = proportionToken(first);
  const mixedProportion = entries.some(
    (d) => proportionToken(d) !== firstProportion,
  );
  const mixed = new Set<string>();
  let value: UnitLithologyValue = { ...first, atts: atts.union };
  if (mixedProportion) {
    mixed.add("prop");
    value = { ...value, prop: null, prop_term: null };
  }
  return {
    value,
    multi: mixedProportion || atts.partial.size > 0,
    partial: { atts: atts.partial },
    mixed,
  };
}

/** A picked item as a unit's entry: its own, or a new one from the
 * definition. */
function entryOf(item: LithItem): UnitLithologyValue {
  if (item.entry != null) return item.entry;
  return {
    lith_id: item.def.lith_id,
    name: item.def.name,
    color: item.def.color,
    prop: null,
    prop_term: null,
    atts: [],
  } as UnitLithologyValue;
}

function proportionOf(entry: UnitLithologyValue) {
  return { prop: entry.prop ?? null, term: entry.prop_term ?? null };
}
