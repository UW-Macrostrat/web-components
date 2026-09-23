/**
 * ItemPicker — pick one or several items from a controlled vocabulary.
 *
 * The standardized control behind the lithology, environment and interval
 * pickers: a row of the chosen items as tags (each removable), and an "add"
 * affordance that opens a searchable list of the vocabulary. It knows nothing
 * about Macrostrat — the caller hands it `items` with an `id`, a `name` and
 * optionally a `color`, and gets the chosen items back through `onChange`.
 * Read-only when `onChange` is absent, so the same component renders the value
 * in a viewer and edits it in an editor.
 */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { type ReactNode, useMemo, useState } from "react";
import { Button, InputGroup, Popover } from "@blueprintjs/core";
import chroma from "chroma-js";
import { Tag, TagSize } from "../components/unit-details/tag";
import styles from "./pickers.module.sass";

const h = hyper.styled(styles);

export interface PickerItem {
  id: number | string;
  name: string;
  color?: chroma.ChromaInput | null;
  /** Secondary text shown in the list (a class, an age range…). */
  description?: ReactNode;
}

export interface ItemPickerProps<T extends PickerItem> {
  /** The vocabulary to choose from. */
  items: T[];
  /** The chosen items. */
  value: T[];
  /** Absent, the picker is read-only. */
  onChange?: (value: T[]) => void;
  /** Allow several items (default). Off, picking replaces the value. */
  multi?: boolean;
  /** Draw a chosen item. Defaults to a coloured `Tag`. */
  renderTag?: (item: T) => ReactNode;
  /** Draw an item in the list. Defaults to name and description. */
  renderItem?: (item: T) => ReactNode;
  /** Order the list. Defaults to the order of `items`. */
  compareItems?: (a: T, b: T) => number;
  /** Text for the add button / empty single value. */
  placeholder?: string;
  searchPlaceholder?: string;
  size?: TagSize;
  disabled?: boolean;
  className?: string;
  /** Rendered after each chosen tag — a proportion input, say. */
  tagAdornment?: (item: T) => ReactNode;
}

export function ItemPicker<T extends PickerItem>(props: ItemPickerProps<T>) {
  const {
    items,
    value,
    onChange,
    multi = true,
    renderTag,
    renderItem,
    compareItems,
    placeholder = multi ? "Add" : "Choose…",
    searchPlaceholder = "Search…",
    size = TagSize.Small,
    disabled = false,
    className,
    tagAdornment,
  } = props;

  const editable = onChange != null && !disabled;
  const chosen = new Set(value.map((d) => d.id));

  const remove = (item: T) => {
    onChange?.(value.filter((d) => d.id !== item.id));
  };

  const pick = (item: T) => {
    if (!multi) {
      onChange?.([item]);
      return;
    }
    if (chosen.has(item.id)) {
      remove(item);
      return;
    }
    onChange?.([...value, item]);
  };

  const tags = value.map((item) =>
    h("span.picked-item", { key: item.id }, [
      renderTag?.(item) ??
        h(Tag, { name: item.name, color: item.color ?? undefined, size }),
      tagAdornment?.(item),
      h.if(editable && multi)(Button, {
        icon: "small-cross",
        minimal: true,
        small: true,
        className: "remove-item",
        title: `Remove ${item.name}`,
        onClick: () => remove(item),
      }),
    ]),
  );

  let adder: ReactNode = null;
  if (editable) {
    let target: ReactNode;
    if (multi || value.length === 0) {
      target = h(Button, {
        icon: multi ? "plus" : "caret-down",
        small: true,
        minimal: true,
        text: multi ? placeholder : placeholder,
        className: "add-item",
      });
    } else {
      // Single mode: the chosen tag is itself the way to change it
      target = h(Button, {
        icon: "caret-down",
        small: true,
        minimal: true,
        className: "change-item",
        title: "Change",
      });
    }
    adder = h(
      Popover,
      {
        minimal: true,
        placement: "bottom-start",
        content: h(ItemPickerList, {
          items,
          chosen,
          multi,
          onPick: pick,
          renderItem,
          compareItems,
          searchPlaceholder,
        }),
      },
      target,
    );
  }

  let empty: ReactNode = null;
  if (value.length === 0 && !editable) {
    empty = h("span.picker-empty", "—");
  }

  return h(
    "div.item-picker",
    { className: classNames(className, { editable, multi }) },
    [tags, empty, adder],
  );
}

interface ItemPickerListProps<T extends PickerItem> {
  items: T[];
  chosen: Set<number | string>;
  multi: boolean;
  onPick: (item: T) => void;
  renderItem?: (item: T) => ReactNode;
  compareItems?: (a: T, b: T) => number;
  searchPlaceholder: string;
}

/** The searchable list inside the popover. Rows toggle in multi mode and
 * pick in single mode; the query narrows by name. */
function ItemPickerList<T extends PickerItem>(props: ItemPickerListProps<T>) {
  const { items, chosen, multi, onPick, renderItem, compareItems } = props;
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q !== "") {
      list = items.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (compareItems != null) list = [...list].sort(compareItems);
    return list.slice(0, 200);
  }, [items, query, compareItems]);

  return h("div.item-picker-list", [
    h(InputGroup, {
      small: true,
      leftIcon: "search",
      placeholder: props.searchPlaceholder,
      value: query,
      autoFocus: true,
      onValueChange: setQuery,
      onKeyDown(evt) {
        // Enter picks the first match, so a name can be typed and taken
        if (evt.key === "Enter" && shown.length > 0) onPick(shown[0]);
      },
    }),
    h(
      "div.item-rows",
      shown.map((item) => {
        const selected = chosen.has(item.id);
        return h(
          "div.item-row",
          {
            key: item.id,
            className: classNames({ selected }),
            onClick: () => onPick(item),
          },
          [
            h("span.item-swatch", {
              style: { background: swatchColor(item.color) },
            }),
            renderItem?.(item) ??
              h("span.item-text", [
                h("span.item-name", item.name),
                h.if(item.description != null)(
                  "span.item-description",
                  item.description,
                ),
              ]),
            h.if(multi && selected)("span.item-check", "✓"),
          ],
        );
      }),
    ),
    h.if(shown.length === 0)("div.picker-empty-list", "No matches"),
  ]);
}

function swatchColor(color: chroma.ChromaInput | null | undefined): string {
  if (color == null) return "transparent";
  try {
    return chroma(color as any).hex();
  } catch {
    return "transparent";
  }
}
