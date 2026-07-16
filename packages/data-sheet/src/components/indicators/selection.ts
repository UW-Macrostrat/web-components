import {
  columnSpecAtom,
  ctx,
  interactionOptionsAtom,
  itemLabelAtom,
  pluralize,
  selectionAtom,
  tableNameAtom,
} from "../../provider";
import { atom } from "jotai";
import { computeSelectionShape, getSelectedColumnKeys } from "../../actions";
import { RegionCardinality } from "@blueprintjs/table";
import classNames from "classnames";
import h from "./selection.module.sass";
import { Tag } from "@blueprintjs/core";

/** A short title describing the current selection (its shape), shown as the
 * toolbar's leading label — no icon. */
const selectionTitleAtom = atom<string | null>((get) => {
  const sel = get(selectionAtom);
  if (sel == null || sel.length === 0) return null;
  const sh = computeSelectionShape(sel);
  const itemName = get(itemLabelAtom);

  switch (sh.cardinality) {
    case RegionCardinality.FULL_COLUMNS: {
      if (sh.columns == 1) {
        const columnSpec = get(columnSpecAtom);
        const columnKey = getSelectedColumnKeys(sel, columnSpec)[0];
        const col = columnSpec.find((c) => c.key === columnKey);
        return col?.name ?? "1 column";
      }
      return itemCount(sh.columns, "column");
    }
    case RegionCardinality.FULL_ROWS:
      return itemCount(sh.rows, itemName);
    case RegionCardinality.CELLS:
      if (sh.columns == 1 || sh.rows == 1) {
        const nCells = Math.max(sh.columns, sh.rows);
        return itemCount(nCells, "cell");
      }
      return `${sh.columns}×${sh.rows} cells`;
    case RegionCardinality.FULL_TABLE:
      return null;
    default:
      return null;
  }
});

function itemCount(n: number, itemType: string) {
  return `${n} ` + pluralize(itemType, n);
}

const toggleModalSelectionAtom = atom(null, (get, set) => {
  const interactionState = get(interactionOptionsAtom);
  if (interactionState.enableModalSelection) {
    const enableSelection = !interactionState.enableSelection;

    if (!enableSelection) {
      set(clearableSelectionAtom);
    }

    set(interactionOptionsAtom, {
      ...interactionState,
      enableSelection,
    });
  }
});
const clearableSelectionAtom = atom(
  (get) => get(selectionAtom),
  (get, set) => {
    set(selectionAtom, []);
  },
);

export function SelectionIndicator({ minimal = true }: { minimal?: boolean }) {
  /** An indicator that shows the table's current selection shape, and optionally modal selection status */
  // The leading title doubles as the clear-selection affordance: with an active
  // selection it renders as a dismissible tag (its ✕ clears the selection),
  // which ties "clear" to the selection it acts on and frees toolbar space.
  // With no selection it's a plain label (table name).
  // Both states render as a `large` `Tag` so the title keeps a constant font
  // and height; only the selected one has a filled background + a ✕ (which
  // clears the selection). The unselected label is a transparent, non-removable
  // tag — visually a plain title, but the same box.

  const [selection, clearSelection] = ctx.use(clearableSelectionAtom);
  const interactionState = ctx.useValue(interactionOptionsAtom);
  const tableName = ctx.useValue(tableNameAtom);

  const toggleModalSelection = ctx.useSet(toggleModalSelectionAtom);
  const { enableModalSelection, enableSelection } = interactionState;

  const hasSelection = selection != null && selection.length > 0;

  let selectionName: string | null = ctx.useValue(selectionTitleAtom);

  let _name = tableName;
  if (hasSelection) {
    _name = selectionName ?? tableName;
  } else if (enableModalSelection) {
    _name = "Select";
  }

  const isClearable = hasSelection || (enableModalSelection && enableSelection);

  if (minimal && !(hasSelection || enableModalSelection)) {
    return null;
  }

  let onClick = null;
  let icon: string | null = null;
  let enterSelectionButton: React.ReactNode = null;
  if (enableModalSelection) {
    onClick = toggleModalSelection;
    if (!isClearable) {
      icon = "more";
    }
  }

  const className = classNames("selection-indicator-tag", {
    enabled: isClearable,
    interactive: onClick != null || hasSelection,
  });

  return h("div.selection-indicator", [
    h(
      Tag,
      {
        minimal: true,
        large: true,
        onClick,
        rightIcon: icon,
        intent: isClearable ? "primary" : undefined,
        className,
        onRemove: isClearable ? clearSelection : undefined,
      },
      [_name, enterSelectionButton],
    ),
  ]);
}
