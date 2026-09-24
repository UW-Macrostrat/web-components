/**
 * TagDetailsEditor — the editor a selected tag opens: the things that can be
 * said about one chosen item (a lithology's proportion and attributes, an
 * interval's position within it), and its removal.
 *
 * Each of those things is a **section**: a label, what adding it is called,
 * a short summary of its current value, the field that edits it, and
 * optionally a way to clear it. The same sections are drawn two ways:
 *
 * - `popover`: a header bar naming the item in its tag's colour, then a
 *   menu of actions — "Add proportion", or "Proportion 60%" once there is
 *   one — each opening its field in place of the menu, with a way back.
 * - `inline`: every field at once, stacked below the picker, under the same
 *   header — or with none (`header: false`), for a single-valued control
 *   whose tag says what is being edited.
 *
 * What is chosen within it is drawn in the item's colours too (see
 * `selection-colors.ts`).
 *
 * Removal is a danger ✕ at the right of a bar: the header's removes the item
 * (`onRemove`), an open section's clears that section (its `onRemove`).
 * Without an `onRemove`, there is no ✕, and the thing can't be removed.
 */
import classNames from "classnames";
import { type ReactNode, useState } from "react";
import { Button, type IconName, Menu, MenuItem } from "@blueprintjs/core";
import type chroma from "chroma-js";
import { useSelectionColors } from "./selection-colors";
import h from "./pickers.module.sass";

export type DetailsMode = "popover" | "inline";

export interface TagDetailsSection {
  key: string;
  /** What the section is: "Proportion", "Attributes". */
  label: string;
  /** The menu's action while the section has no value: "Add proportion".
   * Defaults to the label. */
  addLabel?: string;
  icon?: IconName;
  /** The current value, briefly ("60%", "fine-grained, laminated"); absent
   * or null while there is none. */
  summary?: ReactNode | null;
  /** The field that edits it. */
  editor: ReactNode;
  /** Clear the section's value. Absent — or while there is no value — the
   * section has no ✕. */
  onRemove?: () => void;
}

export interface TagDetailsEditorProps {
  mode: DetailsMode;
  /** The item being edited, named in the header. */
  title?: ReactNode;
  /** The item's colour: its name in the header, and what is chosen within
   * the editor, take it on as its tag does. */
  color?: chroma.ChromaInput | null;
  /** Draw the header (default). Off, the editor is its fields alone. */
  header?: boolean;
  sections?: TagDetailsSection[];
  /** Remove the item. Absent, it can't be removed from here. */
  onRemove?: () => void;
  removeLabel?: string;
  /** Give the item to every row the picker stands for, when only some hold
   * it — an "Apply to all" in the header, before the ✕. */
  onApplyToAll?: () => void;
  className?: string;
}

export function TagDetailsEditor(props: TagDetailsEditorProps) {
  if (props.mode === "inline") return h(InlineDetails, props);
  return h(MenuDetails, props);
}

/** The popover form: a menu of the sections, each opening its field. */
function MenuDetails({
  title,
  color,
  sections = [],
  onRemove,
  removeLabel = "Remove",
  onApplyToAll,
  className,
}: TagDetailsEditorProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = sections.find((d) => d.key === openKey);
  const style = useSelectionColors(color);

  if (open != null) {
    let sectionRemove: (() => void) | undefined;
    if (open.summary != null) sectionRemove = open.onRemove;
    return h("div.tag-details-editor.popover-details", { className, style }, [
      h(DetailsHeader, {
        onBack: () => setOpenKey(null),
        onRemove: sectionRemove,
        removeLabel: `Clear ${open.label.toLowerCase()}`,
        title: [
          h.if(title != null)("span.details-item", title),
          h("span.details-section", open.label),
        ],
      }),
      h("div.details-field-body", open.editor),
    ]);
  }

  return h("div.tag-details-editor.popover-details", { className, style }, [
    h(DetailsHeader, { title, onRemove, removeLabel, onApplyToAll }),
    h.if(sections.length > 0)(
      Menu,
      { small: true, className: "details-menu" },
      sections.map((section) => {
        let text = section.addLabel ?? section.label;
        if (section.summary != null) text = section.label;
        return h(MenuItem, {
          key: section.key,
          icon: section.icon,
          text,
          label: section.summary ?? undefined,
          // Opening a section swaps the menu for its field; the popover stays
          shouldDismissPopover: false,
          onClick: () => setOpenKey(section.key),
        });
      }),
    ),
  ]);
}

/** The inline form: every field, under the header unless it is turned
 * off. */
function InlineDetails({
  title,
  color,
  header = true,
  sections = [],
  onRemove,
  removeLabel = "Remove",
  onApplyToAll,
  className,
}: TagDetailsEditorProps) {
  const style = useSelectionColors(color);
  return h("div.tag-details-editor.inline-details", { className, style }, [
    h.if(header)(DetailsHeader, {
      title,
      onRemove,
      removeLabel,
      onApplyToAll,
    }),
    sections.map((section) => {
      let sectionRemove: (() => void) | undefined;
      if (section.summary != null) sectionRemove = section.onRemove;
      return h("div.details-field", { key: section.key }, [
        h("div.details-field-header", [
          h("span.details-field-label", section.label),
          h(RemoveButton, {
            onRemove: sectionRemove,
            label: `Clear ${section.label.toLowerCase()}`,
          }),
        ]),
        h("div.details-field-body", section.editor),
      ]);
    }),
  ]);
}

/** The bar across the top of a details editor: a way back when a section is
 * open, the title (in the item's colour), and the ✕. */
function DetailsHeader({
  title,
  onBack,
  onRemove,
  removeLabel,
  onApplyToAll,
}: {
  title?: ReactNode;
  onBack?: () => void;
  onRemove?: () => void;
  removeLabel: string;
  onApplyToAll?: () => void;
}) {
  return h("div.details-header", [
    h.if(onBack != null)(Button, {
      icon: "chevron-left",
      minimal: true,
      small: true,
      className: "details-back",
      title: "Back",
      "aria-label": "Back",
      onClick: onBack,
    }),
    h("span.details-title", title),
    h(ApplyToAllButton, { onApplyToAll }),
    h(RemoveButton, { onRemove, label: removeLabel }),
  ]);
}

/** "Apply to all", for an item only some of the rows hold — or nothing. */
export function ApplyToAllButton({
  onApplyToAll,
  className,
}: {
  onApplyToAll?: () => void;
  className?: string;
}) {
  if (onApplyToAll == null) return null;
  return h(Button, {
    icon: "add",
    minimal: true,
    small: true,
    intent: "primary",
    text: "Apply to all",
    className: classNames("apply-to-all", className),
    title: "Give this to every selected row",
    onClick: onApplyToAll,
  });
}

/** A danger ✕, or nothing when there is nothing to remove. */
export function RemoveButton({
  onRemove,
  label = "Remove",
  className,
}: {
  onRemove?: () => void;
  label?: string;
  className?: string;
}) {
  if (onRemove == null) return null;
  return h(Button, {
    icon: "cross",
    minimal: true,
    small: true,
    intent: "danger",
    className: classNames("remove-button", className),
    title: label,
    "aria-label": label,
    onClick: onRemove,
  });
}
