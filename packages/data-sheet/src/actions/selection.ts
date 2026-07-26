import { type Region, RegionCardinality } from "@blueprintjs/table";
import type { ColumnSpec } from "../provider";
import type { TableAction } from "./types";
import { RefObject } from "react";
import { SelectModifiers } from "../data-panel.ts";

export function buildDataViewSelection(
  // index of selected item
  index: number,
  mods: SelectModifiers,
  selection: Region[],
  anchorRef: RefObject<number | null>,
  enableMultipleSelection: boolean,
): Region[] {
  /** Build the selection for data views */
  const current = new Set(getSelectedRowIndices(selection));
  let next: Set<number>;

  const isSingleSelect = current.size === 1;
  const isCurrentlySelected = current.has(index);

  if (!enableMultipleSelection) {
    // Simpler path for single selection
    next = new Set();
    if (!isCurrentlySelected) {
      next.add(index);
    }
    return rowIndicesToRegions(next);
  }
  // multiple selection
  if (isSingleSelect && isCurrentlySelected && !mods.additive && !mods.range) {
    // Clicking the only selected row with no modifiers clears the selection.
    next = new Set();
  } else if (mods.range && anchorRef.current != null) {
    // We have a range select and an anchor: select the range between the anchor and the clicked row.
    const a = anchorRef.current;
    const [lo, hi] = a <= index ? [a, index] : [index, a];
    // Shift extends the existing selection when combined with cmd/ctrl,
    // otherwise replaces it with the range. The anchor stays put so the
    // range can be re-dragged from the same origin.
    next = mods.additive ? new Set(current) : new Set();
    for (let i = lo; i <= hi; i++) next.add(i);
  } else if (mods.additive) {
    // We are adding or removing to the selection with the ctrl key
    next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    anchorRef.current = index;
  } else {
    next = new Set([index]);
    anchorRef.current = index;
  }

  return rowIndicesToRegions(next);
}

/** Collapse a set of selected row indices into `FULL_ROWS` regions, merging
 * contiguous runs into a single `{ rows: [start, end] }` range. */
export function rowIndicesToRegions(indices: Set<number>): Region[] {
  const sorted = Array.from(indices).sort((a, b) => a - b);
  const regions: Region[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  for (const i of sorted) {
    if (start == null) {
      start = prev = i;
    } else if (i === prev! + 1) {
      prev = i;
    } else {
      regions.push({ rows: [start, prev!] });
      start = prev = i;
    }
  }
  if (start != null) regions.push({ rows: [start, prev!] });
  return regions;
}

/** Derive the selection cardinality from the current set of selected regions.
 * Returns "null" when there is no active selection. */
export function getSelectionCardinality(
  regions: Region[],
): RegionCardinality | null {
  if (regions == null || regions.length === 0) return null;
  const region = regions[0];
  const hasRows = region.rows != null;
  const hasCols = region.cols != null;
  if (hasRows && hasCols) return RegionCardinality.CELLS;
  if (hasRows && !hasCols) return RegionCardinality.FULL_ROWS;
  if (!hasRows && hasCols) return RegionCardinality.FULL_COLUMNS;
  return RegionCardinality.FULL_TABLE;
}

/** Selection cardinality including the case of no active selection */
export type SelectionCardinality = RegionCardinality | "none";

/** The concrete *shape* of the current selection — richer than cardinality
 * alone. The "single X" cases are exposed as resolved identity fields on the
 * action context (`columnKey`, `rowIndex`, `cell`); this carries the counts. */
export interface SelectionShape {
  cardinality: SelectionCardinality;
  /** Number of columns the selection spans (0 when not column-scoped). */
  columns: number;
  /** Number of rows the selection spans (0 when not row-scoped). */
  rows: number;
}

/** Compute the concrete shape of a selection (cardinality + column/row spans). */
export function computeSelectionShape(regions: Region[]): SelectionShape {
  const cardinality = getSelectionCardinality(regions) ?? "none";
  let columns = 0;
  let rows = 0;
  for (const region of regions) {
    const c = region.cols;
    if (c != null) {
      columns += c[1] - c[0] + 1;
    }
    const r = region.rows;
    if (r != null) {
      rows += r[1] - r[0] + 1;
    }
  }
  return {
    cardinality,
    columns,
    rows,
  };
}

/** Filter actions to those applicable for the current selection cardinality
 * and edit mode. */
export function getApplicableActions<T>(
  actions: TableAction<T>[],
  cardinality: RegionCardinality,
  editable: boolean,
): TableAction<T>[] {
  return actions.filter((action) => {
    if (action.requiresEditable && !editable) return false;
    return action.targets.includes(cardinality);
  });
}

/** Extract concrete row indices from a set of selected regions.
 * When `filteredRowIndices` is provided, visible indices are mapped
 * to actual data indices. */
export function getSelectedRowIndices(
  regions: Region[],
  filteredRowIndices?: number[] | null,
): number[] {
  if (regions == null || regions.length === 0) return [];
  const indices = new Set<number>();
  for (const region of regions) {
    if (region.rows == null) continue;
    const [start, end] = region.rows;
    for (let i = start; i <= end; i++) {
      indices.add(i);
    }
  }
  const sorted = Array.from(indices).sort((a, b) => a - b);
  if (filteredRowIndices == null) return sorted;
  return sorted.map((i) => filteredRowIndices[i]).filter((i) => i != null);
}

/** Extract column keys covered by a set of selected regions. */
export function getSelectedColumnKeys(
  regions: Region[],
  columnSpec: ColumnSpec[],
): string[] {
  if (regions == null || regions.length === 0) return [];
  const keys = new Set<string>();
  for (const region of regions) {
    if (region.cols == null) {
      // Full-row or full-table selection covers all columns
      for (const col of columnSpec) {
        keys.add(col.key);
      }
    } else {
      const [start, end] = region.cols;
      for (let i = start; i <= end; i++) {
        if (columnSpec[i]) keys.add(columnSpec[i].key);
      }
    }
  }
  return Array.from(keys);
}

/** Compute which data row indices are visible given the active filters.
 * Returns `null` when no filters are active (all rows visible). */
export function computeFilteredRowIndices<T>(
  data: T[],
  updatedData: T[],
  activeFilters: Map<string, { filter: any; state: any }>,
): number[] | null {
  if (activeFilters == null || activeFilters.size === 0) return null;
  const numRows = Math.max(data.length, updatedData.length);
  const indices: number[] = [];
  for (let i = 0; i < numRows; i++) {
    const baseRow = data[i];
    const overlay = updatedData[i];
    const row = overlay != null ? { ...baseRow, ...overlay } : baseRow;
    if (row == null) continue;
    let passes = true;
    for (const [, { filter, state }] of activeFilters) {
      if (!filter.predicate(row, state)) {
        passes = false;
        break;
      }
    }
    if (passes) indices.push(i);
  }
  return indices;
}

/** Merge global actions with column-specific actions from the selected columns.
 * Column-specific actions are extracted from `columnSpec[i].actions` for
 * each column in the current selection. */
export function mergeColumnActions<T>(
  globalActions: TableAction<T>[],
  columnSpec: ColumnSpec[],
  selection: Region[],
): TableAction<T>[] {
  const columnKeys = getSelectedColumnKeys(selection, columnSpec);
  if (columnKeys.length === 0) return globalActions;
  const columnActions: TableAction<T>[] = [];
  for (const col of columnSpec) {
    if (columnKeys.includes(col.key) && col.actions != null) {
      for (const action of col.actions as TableAction<T>[]) {
        // Avoid duplicates by id
        if (
          !globalActions.some((a) => a.id === action.id) &&
          !columnActions.some((a) => a.id === action.id)
        ) {
          columnActions.push(action);
        }
      }
    }
  }
  return [...globalActions, ...columnActions];
}

export function range(arr: number[]) {
  if (arr.length != 2) throw new Error("Range must have two elements");
  const [start, end] = arr;
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}
