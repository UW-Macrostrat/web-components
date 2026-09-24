/**
 * TagPicker — pick one or several items from a controlled vocabulary, drawn
 * as the same tags the details panels use.
 *
 * The chosen items are the tags themselves: no chip around them, no remove
 * cross, no inputs in the row. A tag is selected by clicking it (or focusing
 * it and pressing Enter), and a selected tag opens its **details editor** —
 * in a popover anchored to the tag, or inline below the row
 * (`detailsMode`). What the editor holds is up to the caller
 * (`renderDetails`, usually a `TagDetailsEditor`, whose header carries the
 * ✕ that removes the item). Without one there is no editor to open, and a
 * selected tag is followed by its ✕ instead. Delete or Backspace removes a
 * selected or focused tag, the arrow keys move between tags, and Escape lets
 * go of the selection. With `removable: false`, nothing is removed.
 *
 * It knows nothing about Macrostrat — the caller hands it `items` with an
 * `id`, a `name` and optionally a `color`, and gets the chosen items back
 * through `onChange`. Read-only when `onChange` is absent, so the same
 * component shows a value in a viewer and edits it in an editor.
 */
import classNames from "classnames";
import {
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, InputGroup, PopoverNext } from "@blueprintjs/core";
import chroma from "chroma-js";
import { Tag, TagSize } from "../components/unit-details/tag";
import { type DetailsMode, RemoveButton } from "./tag-details-editor";
import { type SelectionColor, useSelectionColors } from "./selection-colors";
import h from "./pickers.module.sass";

export interface PickerItem {
  id: number | string;
  name: string;
  color?: chroma.ChromaInput | null;
  /** Secondary text shown in the list (a class, an age range…). */
  description?: ReactNode;
}

/** What a details editor is handed for the tag it edits. */
export interface TagDetailsContext<T extends PickerItem> {
  item: T;
  /** Where the editor is drawn, so it can lay itself out to suit. */
  mode: DetailsMode;
  /** Take the item out of the value; absent when the picker's items can't
   * be removed, or when the ✕ follows the tag instead (`removeButton`). */
  remove?: () => void;
  /** Let go of the selection. */
  close(): void;
}

export interface TagPickerProps<T extends PickerItem> {
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
  /** The editor for a selected tag. Absent, a selected tag offers only its
   * removal. */
  renderDetails?: (ctx: TagDetailsContext<T>) => ReactNode;
  /** Where a selected tag's editor opens: a popover on the tag (default) or
   * inline, below the row of tags. */
  detailsMode?: DetailsMode;
  /** Whether chosen items can be removed (default). */
  removable?: boolean;
  /** Where a selected tag's ✕ is: in its details editor (the default when
   * there is one) or right after the tag (the default when there isn't). */
  removeButton?: "details" | "tag";
  /** Draw an item in the list. Defaults to name and description. */
  renderItem?: (item: T) => ReactNode;
  /** Order the list. Defaults to the order of `items`. */
  compareItems?: (a: T, b: T) => number;
  /** What the add affordance does ("Add lithology"): its tooltip, and its
   * label when `addLabel` is set. */
  placeholder?: string;
  /** Show `placeholder` as the add button's text. Off (the default) the
   * button is a bare +, since the picker usually sits under a field label
   * that already says what is being added. */
  addLabel?: boolean;
  searchPlaceholder?: string;
  size?: TagSize;
  disabled?: boolean;
  className?: string;
  /** Rendered at the end of the row of tags — a derived value, say. */
  trailing?: ReactNode;
  /** The colour the list draws chosen items in — the colour of the item the
   * picker belongs to, for a picker nested in its editor. */
  selectionColor?: SelectionColor;
}

export function TagPicker<T extends PickerItem>(props: TagPickerProps<T>) {
  const {
    items,
    value,
    onChange,
    multi = true,
    renderTag,
    renderDetails,
    detailsMode = "popover",
    removable = true,
    renderItem,
    compareItems,
    placeholder = multi ? "Add" : "Choose…",
    addLabel = false,
    searchPlaceholder = "Search…",
    size = TagSize.Small,
    disabled = false,
    className,
    trailing,
    selectionColor,
  } = props;

  const editable = onChange != null && !disabled;
  const canRemove = editable && removable;
  const chosen = new Set(value.map((d) => d.id));
  const hasDetails = renderDetails != null;
  let removeButton = props.removeButton ?? "details";
  if (!hasDetails) removeButton = "tag";

  const [selectedID, setSelectedID] = useState<number | string | null>(null);
  // A selection outlives neither its item nor the picker's editability
  let selected: T | null = null;
  if (editable && selectedID != null) {
    selected = value.find((d) => d.id === selectedID) ?? null;
  }

  const rowRef = useRef<HTMLDivElement>(null);
  // Where focus goes once a removal has rendered: the tag that took the
  // removed one's place, else the add button
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    const index = pendingFocus.current;
    if (index == null) return;
    pendingFocus.current = null;
    const tags = tagElements(rowRef.current);
    const next = tags[Math.min(index, tags.length - 1)];
    if (next != null) {
      next.focus();
      return;
    }
    rowRef.current?.querySelector<HTMLElement>(".add-item")?.focus();
  }, [value]);

  const remove = (item: T) => {
    if (!canRemove) return;
    const index = value.findIndex((d) => d.id === item.id);
    pendingFocus.current = index;
    if (selectedID === item.id) setSelectedID(null);
    onChange?.(value.filter((d) => d.id !== item.id));
  };

  const pick = (item: T) => {
    if (!multi) {
      onChange?.([item]);
      return;
    }
    if (chosen.has(item.id)) {
      // A chosen item that can't be removed can't be toggled off either
      remove(item);
      return;
    }
    onChange?.([...value, item]);
  };

  const toggleSelected = (item: T) => {
    if (selectedID === item.id) {
      setSelectedID(null);
      return;
    }
    setSelectedID(item.id);
  };

  const onTagKeyDown = (evt: KeyboardEvent<HTMLElement>, item: T) => {
    // A picker can sit inside another's details editor; its keys are its own
    if (handledKeys.has(evt.key)) evt.stopPropagation();
    if (evt.key === "Delete" || evt.key === "Backspace") {
      evt.preventDefault();
      remove(item);
    } else if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      toggleSelected(item);
    } else if (evt.key === "Escape") {
      setSelectedID(null);
    } else if (evt.key === "ArrowLeft" || evt.key === "ArrowRight") {
      evt.preventDefault();
      const tags = tagElements(rowRef.current);
      const index = tags.indexOf(evt.currentTarget);
      let step = 1;
      if (evt.key === "ArrowLeft") step = -1;
      tags[index + step]?.focus();
    }
  };

  const details = (item: T, mode: DetailsMode) => {
    let removeItem: (() => void) | undefined;
    if (canRemove && removeButton === "details")
      removeItem = () => remove(item);
    const ctx: TagDetailsContext<T> = {
      item,
      mode,
      remove: removeItem,
      close: () => setSelectedID(null),
    };
    return renderDetails?.(ctx);
  };

  const tags = value.map((item) => {
    const isSelected = selected?.id === item.id;
    const tag =
      renderTag?.(item) ??
      h(Tag, { name: item.name, color: item.color ?? undefined, size });

    if (!editable) {
      return h("span.picker-tag", { key: item.id }, tag);
    }

    const targetProps = {
      key: item.id,
      tabIndex: 0,
      role: "button",
      "aria-pressed": isSelected,
      "aria-label": item.name,
      "data-picker-tag": true,
      className: classNames("editable", { selected: isSelected }),
      onClick: () => toggleSelected(item),
      onKeyDown: (evt) => onTagKeyDown(evt, item),
    };

    // The ✕ after the tag, while it is selected, when that's where it goes
    let tagRemove: ReactNode = null;
    if (isSelected && canRemove && removeButton === "tag") {
      tagRemove = h(RemoveButton, {
        className: "tag-remove",
        label: `Remove ${item.name}`,
        onRemove: () => remove(item),
      });
    }

    if (detailsMode === "inline" || !hasDetails) {
      return h(Fragment, { key: item.id }, [
        h("span.picker-tag", targetProps, tag),
        tagRemove,
      ]);
    }

    // Every tag carries its popover, open only while it is selected, so that
    // selecting a tag doesn't remount it and take its focus away
    return h(Fragment, { key: item.id }, [
      h(PopoverNext, {
        isOpen: isSelected,
        placement: "bottom-start",
        minimal: true,
        // Focus stays on the tag, so Delete and the arrow keys keep working
        autoFocus: false,
        enforceFocus: false,
        lazy: true,
        onInteraction(nextOpen) {
          // Outside clicks and Escape; a click on the tag is its own toggle
          if (!nextOpen) setSelectedID(null);
        },
        content: h(
          DetailsKeyBoundary,
          {
            onRemove: () => remove(item),
            onClose: () => setSelectedID(null),
          },
          details(item, "popover"),
        ),
        renderTarget: ({ ref }) =>
          h("span.picker-tag", { ...targetProps, key: undefined, ref }, tag),
      }),
      tagRemove,
    ]);
  });

  let adder: ReactNode = null;
  if (editable) {
    let target: ReactNode;
    if (multi || value.length === 0) {
      let text: string | undefined;
      if (addLabel || !multi) text = placeholder;
      let icon: "plus" | "caret-down" = "plus";
      if (!multi) icon = "caret-down";
      target = h(Button, {
        icon,
        small: true,
        minimal: true,
        text,
        title: placeholder,
        "aria-label": placeholder,
        className: "add-item",
      });
    } else {
      // Single mode: a caret beside the chosen tag changes it
      target = h(Button, {
        icon: "caret-down",
        small: true,
        minimal: true,
        className: "add-item change-item",
        title: "Change",
        "aria-label": "Change",
      });
    }
    adder = h(
      PopoverNext,
      {
        minimal: true,
        placement: "bottom-start",
        content: h(VocabularyList, {
          items,
          chosen,
          multi,
          onPick: pick,
          renderItem,
          compareItems,
          searchPlaceholder,
          selectionColor,
        }),
      },
      target,
    );
  }

  let empty: ReactNode = null;
  if (value.length === 0 && !editable) {
    empty = h("span.picker-empty", "—");
  }

  let inlineDetails: ReactNode = null;
  if (detailsMode === "inline" && hasDetails && selected != null) {
    inlineDetails = h(
      DetailsKeyBoundary,
      {
        className: "tag-details-inline",
        onRemove: () => remove(selected),
        onClose: () => setSelectedID(null),
      },
      details(selected, "inline"),
    );
  }

  return h(
    "div.tag-picker",
    { className: classNames(className, { editable, multi }) },
    [
      h("div.tag-row", { ref: rowRef }, [tags, empty, adder, trailing]),
      inlineDetails,
    ],
  );
}

/** Around a details editor: Delete removes the tag and Escape closes the
 * editor, except while typing in one of its fields. */
function DetailsKeyBoundary({
  children,
  className,
  onRemove,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  onRemove: () => void;
  onClose: () => void;
}) {
  const onKeyDown = (evt: KeyboardEvent<HTMLElement>) => {
    if (evt.key === "Escape") {
      evt.stopPropagation();
      onClose();
      return;
    }
    if (isTextEntry(evt.target)) return;
    if (evt.key === "Delete" || evt.key === "Backspace") {
      evt.stopPropagation();
      evt.preventDefault();
      onRemove();
    }
  };
  return h("div.tag-details", { className, onKeyDown }, children);
}

export interface VocabularyListProps<T extends PickerItem> {
  items: T[];
  chosen: Set<number | string>;
  multi: boolean;
  onPick: (item: T) => void;
  renderItem?: (item: T) => ReactNode;
  compareItems?: (a: T, b: T) => number;
  searchPlaceholder: string;
  autoFocus?: boolean;
  /** Draw chosen items in this colour (see `selection-colors.ts`); without
   * one, in the colours of an enclosing details editor, if any. */
  selectionColor?: SelectionColor;
}

/** The searchable list of a vocabulary. Rows toggle in multi mode and pick
 * in single mode; chosen rows are bold, in the selection colours. The query
 * narrows by name, and Enter takes the first match. */
export function VocabularyList<T extends PickerItem>(
  props: VocabularyListProps<T>,
) {
  const {
    items,
    chosen,
    onPick,
    renderItem,
    compareItems,
    autoFocus = true,
    selectionColor,
  } = props;
  const [query, setQuery] = useState("");
  const style = useSelectionColors(selectionColor);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q !== "") {
      list = items.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (compareItems != null) list = [...list].sort(compareItems);
    return list.slice(0, 200);
  }, [items, query, compareItems]);

  return h("div.vocabulary-list", { style }, [
    h(InputGroup, {
      small: true,
      leftIcon: "search",
      placeholder: props.searchPlaceholder,
      value: query,
      autoFocus,
      onValueChange: setQuery,
      onKeyDown(evt) {
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
            h.if(item.color != null)("span.item-swatch", {
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
          ],
        );
      }),
    ),
    h.if(shown.length === 0)("div.picker-empty-list", "No matches"),
  ]);
}

const handledKeys = new Set([
  "Delete",
  "Backspace",
  "Enter",
  " ",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
]);

function tagElements(row: HTMLElement | null): HTMLElement[] {
  if (row == null) return [];
  return Array.from(row.querySelectorAll<HTMLElement>("[data-picker-tag]"));
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}

function swatchColor(color: chroma.ChromaInput | null | undefined): string {
  if (color == null) return "transparent";
  try {
    return chroma(color as any).hex();
  } catch {
    return "transparent";
  }
}
