/**
 * TagPicker — pick one or several items from a controlled vocabulary, drawn
 * as the same tags the details panels use.
 *
 * The chosen items are the tags themselves: no chip around them, no remove
 * cross, no inputs in the row. A tag is selected by clicking it (or focusing
 * it and pressing Enter), and a selected tag opens its **details editor** —
 * in a popover anchored to the tag, inline below the row, or — `stack` — in
 * place of the row, for a picker that is itself in a popover: the tags, then
 * the chosen tag's menu, then a section, each with a way back
 * (`detailsMode`). What the editor holds is up to the caller
 * (`renderDetails`, usually a `TagDetailsEditor`, whose header carries the
 * ✕ that removes the item). Without one there is no editor to open, and a
 * selected tag is followed by its ✕ instead. Delete or Backspace removes a
 * selected or focused tag, the arrow keys move between tags, and Escape lets
 * go of the selection. With `removable: false`, nothing is removed.
 *
 * Standing for several rows at once (see `multi-values.ts`), the value is
 * what they hold between them, and the items only some hold are `partial`:
 * drawn faded, with an "Apply to all" (`onApplyToAll`) where the ✕ is.
 *
 * Where its row is kept to one line (a container sets `--tag-row-wrap:
 * nowrap`, as a table cell does), tags keep their width rather than being
 * squeezed, and those that don't fit give way to "and n more".
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
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, InputGroup, PopoverNext } from "@blueprintjs/core";
import chroma from "chroma-js";
import { Tag, TagSize } from "../components/unit-details/tag";
import {
  ApplyToAllButton,
  type DetailsMode,
  RemoveButton,
} from "./tag-details-editor";
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
  /** In `stack` mode, back from the item's editor to the tags. */
  back?: () => void;
  /** Whether only some of the rows the picker stands for hold the item. */
  partial: boolean;
  /** Give the item to every row; present for a partial item when the picker
   * has `onApplyToAll`. */
  applyToAll?: () => void;
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
  /** The ids of items only some of the rows the picker stands for hold. */
  partial?: Set<number | string> | null;
  /** Give a partial item to every row. */
  onApplyToAll?: (item: T) => void;
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
    partial = null,
    onApplyToAll,
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

  const isPartial = (item: T) => partial?.has(item.id) ?? false;
  const applyToAllFor = (item: T) => {
    if (!editable || onApplyToAll == null || !isPartial(item)) return undefined;
    return () => onApplyToAll(item);
  };

  const details = (item: T, mode: DetailsMode) => {
    let removeItem: (() => void) | undefined;
    if (canRemove && removeButton === "details")
      removeItem = () => remove(item);
    let applyToAll: (() => void) | undefined;
    if (removeButton === "details") applyToAll = applyToAllFor(item);
    const ctx: TagDetailsContext<T> = {
      item,
      mode,
      remove: removeItem,
      close: () => setSelectedID(null),
      partial: isPartial(item),
      applyToAll,
    };
    if (mode === "stack") ctx.back = () => setSelectedID(null);
    return renderDetails?.(ctx);
  };

  // On a one-line row, the index of the first tag that doesn't fit
  const overflowFrom = useOverflowFrom(
    rowRef,
    value.map((d) => d.id).join("\u0000"),
  );

  const tags = value.map((item, index) => {
    const isSelected = selected?.id === item.id;
    const tag =
      renderTag?.(item) ??
      h(Tag, { name: item.name, color: item.color ?? undefined, size });

    const partialItem = isPartial(item);
    const overflowed = overflowFrom != null && index >= overflowFrom;

    if (!editable) {
      return h(
        "span.picker-tag",
        {
          key: item.id,
          "data-picker-item": true,
          className: classNames({ partial: partialItem, overflowed }),
        },
        tag,
      );
    }

    const targetProps = {
      key: item.id,
      tabIndex: 0,
      role: "button",
      "aria-pressed": isSelected,
      "aria-label": item.name,
      "data-picker-tag": true,
      "data-picker-item": true,
      className: classNames("editable", {
        selected: isSelected,
        partial: partialItem,
        overflowed,
      }),
      onClick: () => toggleSelected(item),
      onKeyDown: (evt) => onTagKeyDown(evt, item),
    };

    // The ✕ after the tag, while it is selected, when that's where it goes —
    // and, for a partial item, its "apply to all" beside it
    let tagRemove: ReactNode = null;
    if (isSelected && removeButton === "tag") {
      let onRemove: (() => void) | undefined;
      if (canRemove) onRemove = () => remove(item);
      tagRemove = [
        h(ApplyToAllButton, {
          className: "tag-remove",
          onApplyToAll: applyToAllFor(item),
        }),
        h(RemoveButton, {
          className: "tag-remove",
          label: `Remove ${item.name}`,
          onRemove,
        }),
      ];
    }

    if (detailsMode !== "popover" || !hasDetails) {
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
        "data-picker-adder": true,
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
        "data-picker-adder": true,
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
          partial,
        }),
      },
      target,
    );
  }

  let more: ReactNode = null;
  if (overflowFrom != null && overflowFrom < value.length) {
    const hidden = value.slice(overflowFrom);
    more = h(
      "span.more-tags",
      { title: hidden.map((d) => d.name).join(", ") },
      `and ${hidden.length} more`,
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

  // Stacked, the selected tag's editor takes the row's place
  if (detailsMode === "stack" && hasDetails && selected != null) {
    return h(
      "div.tag-picker",
      { className: classNames(className, "stacked", { editable, multi }) },
      h(
        DetailsKeyBoundary,
        {
          className: "tag-details-stacked",
          onRemove: () => remove(selected),
          onClose: () => setSelectedID(null),
        },
        details(selected, "stack"),
      ),
    );
  }

  return h(
    "div.tag-picker",
    { className: classNames(className, { editable, multi }) },
    [
      h("div.tag-row", { ref: rowRef }, [tags, more, empty, adder, trailing]),
      inlineDetails,
    ],
  );
}

/** On a row kept to one line (`flex-wrap: nowrap`), the index of the first
 * tag that doesn't fit, leaving room for the adder and "and n more"; `null`
 * when all fit, or when the row wraps. The first tag always stays, clipped if
 * it must be: "and 1 more" in place of the only tag says less than the tag.
 *
 * Tags keep their widths whether shown or not (the hidden ones are taken out
 * of the flow at their full width, not resized), so the measure is stable. It
 * re-runs when the tags or the row's *width* change — not its height, which
 * hiding tags can change, and which would otherwise re-measure the row's own
 * reaction to the measure. */
function useOverflowFrom(
  rowRef: RefObject<HTMLElement | null>,
  tagsKey: string,
): number | null {
  const [from, setFrom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (row == null) return;
    let measuredWidth: number | null = null;
    const measure = () => {
      measuredWidth = row.clientWidth;
      const style = getComputedStyle(row);
      if (style.flexWrap !== "nowrap") {
        setFrom(null);
        return;
      }
      const gap = parseFloat(style.columnGap) || 0;
      const widths = Array.from(
        row.querySelectorAll<HTMLElement>("[data-picker-item]"),
      ).map((el) => el.offsetWidth);
      let adders = 0;
      for (const el of row.querySelectorAll<HTMLElement>(
        "[data-picker-adder]",
      )) {
        adders += el.offsetWidth + gap;
      }
      const available = row.clientWidth - adders;
      const total =
        widths.reduce((a, b) => a + b, 0) +
        gap * Math.max(widths.length - 1, 0);
      if (total <= available) {
        setFrom(null);
        return;
      }
      // Room for "and n more"
      const reserve = (parseFloat(style.fontSize) || 12) * 5 + gap;
      let used = 0;
      let fit = 0;
      for (const width of widths) {
        let next = used + width;
        if (fit > 0) next += gap;
        if (next > available - reserve) break;
        used = next;
        fit += 1;
      }
      setFrom(Math.max(fit, 1));
    };
    measure();
    const observer = new ResizeObserver(() => {
      if (row.clientWidth === measuredWidth) return;
      measure();
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [rowRef, tagsKey]);
  return from;
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
  /** Chosen items only some of the rows hold, drawn faded. */
  partial?: Set<number | string> | null;
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
    partial = null,
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
            className: classNames({
              selected,
              partial: selected && (partial?.has(item.id) ?? false),
            }),
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
