/**
 * EnvironmentPicker — a unit's environments, drawn as the `LithologyTag`s
 * the details panels use. Its vocabulary comes from the enclosing
 * `MacrostratDataProvider` unless given as a prop, and it hands back the
 * unit's own `Environment[]` shape. An environment carries nothing of its
 * own, so there is no editor to open: a selected one is followed by its ✕.
 */
import { useMemo } from "react";
import type { Environment } from "@macrostrat/api-types";
import { LithologyTag } from "../components/unit-details";
import { TagSize } from "../components/unit-details/tag";
import { type PickerItem, TagPicker } from "./tag-picker";
import { useVocabulary, type Vocabulary } from "./vocabularies";
import h from "./pickers.module.sass";

/** An environment definition, as `/defs/environments` reports it. */
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
  value: EnvironmentValue[] | null | undefined;
  onChange?: (value: EnvironmentValue[]) => void;
  /** The environment vocabulary. Defaults to the data provider's. */
  environments?: Vocabulary<EnvironmentDef>;
  /** Whether environments can be removed (default). */
  removable?: boolean;
  /** The size of the tags (default small). */
  size?: TagSize;
  disabled?: boolean;
  className?: string;
}

export function EnvironmentPicker(props: EnvironmentPickerProps) {
  const {
    value,
    onChange,
    removable,
    size = TagSize.Small,
    disabled,
    className,
  } = props;
  const defs = useVocabulary<EnvironmentDef>(
    "environments",
    props.environments,
  );
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

  let change: ((next: EnvItem[]) => void) | undefined;
  if (onChange != null) change = emit;

  return h(TagPicker<EnvItem>, {
    className,
    items,
    value: picked,
    onChange: change,
    disabled,
    removable,
    placeholder: "Add environment",
    searchPlaceholder: "Search environments…",
    renderTag: (item) =>
      h(LithologyTag, {
        data: { ...item.def, ...(item.entry ?? {}) } as any,
        size,
        interactive: false,
      }),
  });
}
