/**
 * Lithology and environment pickers: `ItemPicker` over Macrostrat's
 * vocabularies, drawing the chosen items as the same `LithologyTag`s the
 * details panels use, so a unit's lithology reads the same whether it is
 * being looked at or changed.
 *
 * Both take their vocabulary as a prop rather than fetching it — the caller
 * decides where definitions come from (`useMacrostratDefs`, a fixture, a
 * server) — and hand back the unit's own array shape (`UnitLithology[]`,
 * `Environment[]`), so a value round-trips without translation.
 */
import hyper from "@macrostrat/hyper";
import { type ReactNode, useMemo } from "react";
import type { Environment, UnitLithology } from "@macrostrat/api-types";
import { InputGroup } from "@blueprintjs/core";
import { LithologyTag, LithologyTagFeature } from "../components/unit-details";
import { TagSize } from "../components/unit-details/tag";
import { ItemPicker, type PickerItem } from "./item-picker";
import styles from "./pickers.module.sass";

const h = hyper.styled(styles);

/** A lithology definition as `useMacrostratDefs("lithologies")` holds it. */
export interface LithologyDef {
  lith_id: number;
  name: string;
  color?: string;
  type?: string;
  class?: string;
  group?: string | null;
}

/** A unit's lithology entry: the definition's id and name, with the unit's
 * own proportion and attributes. */
export type UnitLithologyValue = Pick<UnitLithology, "lith_id" | "name"> &
  Partial<UnitLithology> & { color?: string };

type LithItem = PickerItem & { def: LithologyDef };

export interface LithologyPickerProps {
  /** The lithology vocabulary. */
  lithologies: LithologyDef[] | Map<number, LithologyDef> | null | undefined;
  value: UnitLithologyValue[] | null | undefined;
  onChange?: (value: UnitLithologyValue[]) => void;
  /** Show and edit each lithology's proportion (0–1, shown as a percent). */
  proportions?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LithologyPicker(props: LithologyPickerProps) {
  const {
    lithologies,
    value,
    onChange,
    proportions = true,
    disabled,
    className,
  } = props;

  const defs = useMemo(() => toArray(lithologies), [lithologies]);
  const byID = useMemo(
    () => new Map(defs.map((d) => [d.lith_id, d])),
    [defs],
  );

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

  // The value as picker items, carrying the unit's own entry so a change can
  // give it back unaltered.
  const picked: (LithItem & { entry: UnitLithologyValue })[] = useMemo(
    () =>
      (value ?? []).map((entry) => {
        const def = byID.get(entry.lith_id);
        return {
          id: entry.lith_id,
          name: entry.name ?? def?.name ?? `#${entry.lith_id}`,
          color: entry.color ?? def?.color,
          def: def ?? { lith_id: entry.lith_id, name: entry.name },
          entry,
        };
      }),
    [value, byID],
  );

  const features = useMemo(() => {
    const set = new Set<LithologyTagFeature>([LithologyTagFeature.Attributes]);
    if (proportions && onChange == null) set.add(LithologyTagFeature.Proportion);
    return set;
  }, [proportions, onChange]);

  const emit = (next: LithItem[]) => {
    onChange?.(
      next.map((item) => {
        const existing = (item as any).entry as UnitLithologyValue | undefined;
        if (existing != null) return existing;
        return {
          lith_id: item.def.lith_id,
          name: item.def.name,
          color: item.def.color,
          prop: null,
          atts: [],
        } as UnitLithologyValue;
      }),
    );
  };

  const setProportion = (lith_id: number, prop: number | null) => {
    onChange?.(
      (value ?? []).map((entry) =>
        entry.lith_id === lith_id ? { ...entry, prop } : entry,
      ),
    );
  };

  let tagAdornment: ((item: LithItem) => ReactNode) | undefined;
  if (proportions && onChange != null && !disabled) {
    tagAdornment = (item) =>
      h(ProportionInput, {
        value: (item as any).entry?.prop ?? null,
        onChange: (prop) => setProportion(item.def.lith_id, prop),
      });
  }

  return h(ItemPicker<LithItem>, {
    className,
    items,
    value: picked,
    onChange: onChange == null ? undefined : emit,
    disabled,
    placeholder: "Add lithology",
    searchPlaceholder: "Search lithologies…",
    renderTag: (item) =>
      h(LithologyTag, {
        data: { ...item.def, ...((item as any).entry ?? {}) } as any,
        features,
        size: TagSize.Small,
        interactive: false,
      }),
    tagAdornment,
  });
}

/** A proportion as a percent, committed on blur or Enter. Blank clears it —
 * lithologies with no proportion are taken as equal parts. */
function ProportionInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (prop: number | null) => void;
}) {
  const text = value == null ? "" : String(Math.round(value * 100));
  const commit = (raw: string) => {
    const trimmed = raw.trim().replace("%", "");
    if (trimmed === "") {
      if (value != null) onChange(null);
      return;
    }
    const pct = Number(trimmed);
    if (isNaN(pct)) return;
    const prop = Math.min(Math.max(pct / 100, 0), 1);
    if (prop !== value) onChange(prop);
  };
  return h(InputGroup, {
    className: "proportion-input",
    small: true,
    defaultValue: text,
    key: text,
    placeholder: "%",
    rightElement: h("span.percent-sign", "%"),
    title: "Proportion of the unit",
    onBlur: (evt) => commit(evt.target.value),
    onKeyDown(evt) {
      if (evt.key === "Enter") commit((evt.target as HTMLInputElement).value);
    },
  });
}

/* ------------------------------------------------------------ environments */

/** An environment definition as `useMacrostratDefs("environments")` holds it. */
export interface EnvironmentDef {
  environ_id: number;
  name: string;
  color?: string;
  type?: string;
  class?: string;
}

export type EnvironmentValue = Pick<Environment, "environ_id" | "name"> &
  Partial<Environment> & { color?: string };

type EnvItem = PickerItem & { def: EnvironmentDef; entry?: EnvironmentValue };

export interface EnvironmentPickerProps {
  environments:
    | EnvironmentDef[]
    | Map<number, EnvironmentDef>
    | null
    | undefined;
  value: EnvironmentValue[] | null | undefined;
  onChange?: (value: EnvironmentValue[]) => void;
  disabled?: boolean;
  className?: string;
}

export function EnvironmentPicker(props: EnvironmentPickerProps) {
  const { environments, value, onChange, disabled, className } = props;
  const defs = useMemo(() => toArray(environments), [environments]);
  const byID = useMemo(
    () => new Map(defs.map((d) => [d.environ_id, d])),
    [defs],
  );

  const items: EnvItem[] = useMemo(
    () =>
      defs.map((def) => ({
        id: def.environ_id,
        name: def.name,
        color: def.color,
        description: [def.class, def.type].filter(Boolean).join(" · "),
        def,
      })),
    [defs],
  );

  const picked: EnvItem[] = useMemo(
    () =>
      (value ?? []).map((entry) => {
        const def = byID.get(entry.environ_id);
        return {
          id: entry.environ_id,
          name: entry.name ?? def?.name ?? `#${entry.environ_id}`,
          color: entry.color ?? def?.color,
          def: def ?? { environ_id: entry.environ_id, name: entry.name },
          entry,
        };
      }),
    [value, byID],
  );

  const emit = (next: EnvItem[]) => {
    onChange?.(
      next.map(
        (item) =>
          item.entry ?? {
            environ_id: item.def.environ_id,
            name: item.def.name,
            color: item.def.color,
            type: item.def.type,
            class: item.def.class,
          },
      ),
    );
  };

  return h(ItemPicker<EnvItem>, {
    className,
    items,
    value: picked,
    onChange: onChange == null ? undefined : emit,
    disabled,
    placeholder: "Add environment",
    searchPlaceholder: "Search environments…",
    renderTag: (item) =>
      h(LithologyTag, {
        data: { ...item.def, ...(item.entry ?? {}) } as any,
        size: TagSize.Small,
        interactive: false,
      }),
  });
}

function toArray<T>(source: T[] | Map<any, T> | null | undefined): T[] {
  if (source == null) return [];
  if (Array.isArray(source)) return source;
  return Array.from(source.values());
}
