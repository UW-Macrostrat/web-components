import { RegionCardinality } from "@blueprintjs/table";
import type { TableAction, TableActionContext, CellEdit } from "./types";
import type { ClipboardProxy } from "../provider/types.ts";

/** Serialize the current selection to tab-separated values.
 * For full-row/column copies, includes a header row and produces
 * a `ClipboardProxy` for potential backend-mediated paste. */
export function serializeSelectionToTSV<T>(ctx: TableActionContext<T>): {
  text: string;
  proxy?: ClipboardProxy;
} {
  const { data, updatedData, columnSpec } = ctx;
  const cardinality = ctx.selectionCardinality ?? RegionCardinality.FULL_TABLE;
  const numRows = Math.max(data.length, updatedData.length);

  let rowIndices: number[];
  let columnKeys: string[];
  let includeHeaders = false;

  switch (cardinality) {
    case RegionCardinality.CELLS:
      rowIndices = ctx.getSelectedRowIndices();
      columnKeys = ctx.getSelectedColumnKeys();
      break;
    case RegionCardinality.FULL_ROWS:
      rowIndices = ctx.getSelectedRowIndices();
      columnKeys = columnSpec.map((c) => c.key);
      // TODO: include headers, but copy using proxy...
      includeHeaders = false;
      break;
    case RegionCardinality.FULL_COLUMNS:
      rowIndices = Array.from({ length: numRows }, (_, i) => i);
      columnKeys = ctx.getSelectedColumnKeys();
      includeHeaders = false;
      break;
    default:
      rowIndices = Array.from({ length: numRows }, (_, i) => i);
      columnKeys = columnSpec.map((c) => c.key);
      includeHeaders = false;
      break;
  }

  const rows: string[] = [];
  if (includeHeaders) {
    const headers = columnKeys.map((key) => {
      const col = columnSpec.find((c) => c.key === key);
      return col?.name ?? key;
    });
    rows.push(headers.join("\t"));
  }

  const selectedColumns = columnSpec.filter((d) => columnKeys.includes(d.key));

  for (const i of rowIndices) {
    const row = { ...data[i], ...updatedData[i] };
    rows.push(
      selectedColumns
        .map((col) => {
          const value = row[col.key];
          return String(col.valueRenderer?.(value) ?? value ?? "");
        })
        .join("\t"),
    );
  }

  const text = rows.join("\n");

  // For full rows/columns, also create a proxy for backend-mediated paste
  let proxy: ClipboardProxy | undefined;
  if (
    cardinality === RegionCardinality.FULL_ROWS ||
    cardinality === RegionCardinality.FULL_COLUMNS
  ) {
    proxy = {
      cardinality,
      rowIndices:
        cardinality === RegionCardinality.FULL_ROWS ? rowIndices : undefined,
      columnKeys:
        cardinality === RegionCardinality.FULL_COLUMNS ? columnKeys : undefined,
      text,
    };
  }

  return { text, proxy };
}

/** Parse tab-separated text into a 2D string array. */
function parseTSV(text: string): string[][] {
  return text
    .trim()
    .split("\n")
    .map((row) => row.split("\t"));
}

/** Copy the current selection to the clipboard as tab-separated text.
 * For full-row/column copies, a `ClipboardProxy` is also stored in the
 * table state, enabling backend-mediated paste in lazy-loaded tables. */
export const copyAction: TableAction = {
  id: "copy",
  name: "Copy",
  icon: "clipboard",
  targets: [
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: false,
  async run(ctx) {
    const { text, proxy } = serializeSelectionToTSV(ctx);
    console.log("Copying text:", text);
    await navigator.clipboard.writeText(text);
    ctx.setClipboardProxy(proxy ?? null);
  },
  hotkey: "mod+c",
};

export const cutAction: TableAction = {
  id: "cut",
  name: "Cut",
  icon: "clipboard",
  targets: [
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: true,
  async run(ctx) {
    const { text, proxy } = serializeSelectionToTSV(ctx);
    console.log("Cutting text:", text);
    await navigator.clipboard.writeText(text);
    ctx.setClipboardProxy(proxy ?? null);
    ctx.clearSelection();
  },
  hotkey: "mod+x",
};

/** Describes the shape relationship between pasted data and the target region */
export enum PasteShape {
  /** Data fits exactly into the target region */
  EXACT = "exact",
  /** Data is smaller than the target region in one or both dimensions */
  SMALLER = "smaller",
  /** Data is larger than the target region in one or both dimensions */
  LARGER = "larger",
  /** Pasting into a single cell — expand from that anchor */
  SINGLE_CELL = "single-cell",
}

/** Determine the relationship between clipboard data shape and target region */
function getPasteShape(
  parsed: string[][],
  targetRows: number,
  targetCols: number,
): PasteShape {
  if (targetRows === 1 && targetCols === 1) return PasteShape.SINGLE_CELL;
  const dataRows = parsed.length;
  const dataCols = Math.max(...parsed.map((r) => r.length));
  if (dataRows === targetRows && dataCols === targetCols)
    return PasteShape.EXACT;
  if (dataRows <= targetRows && dataCols <= targetCols)
    return PasteShape.SMALLER;
  return PasteShape.LARGER;
}

/** Build cell edits for an Excel-style paste.
 *
 * Behavior by shape:
 * - **SINGLE_CELL**: Paste the full clipboard grid anchored at the focused
 *   cell, expanding rightward and downward. Clips at table boundaries.
 * - **EXACT**: Paste one-to-one into the selected region.
 * - **SMALLER**: Tile (repeat) the clipboard data to fill the selection,
 *   matching Excel's behavior when the selection is an even multiple of the
 *   data. Otherwise, just paste once from the top-left of the selection.
 * - **LARGER**: Truncate the data to fit the target selection. */
function buildPasteEdits(
  parsed: string[][],
  startRow: number,
  startColIdx: number,
  targetRowCount: number,
  targetColCount: number,
  shape: PasteShape,
  ctx: TableActionContext,
): CellEdit[] {
  const dataRows = parsed.length;
  const dataCols = Math.max(...parsed.map((r) => r.length));
  const numDataRows = Math.max(ctx.data.length, ctx.updatedData.length);
  const numCols = ctx.columnSpec.length;
  const edits: CellEdit[] = [];

  let pasteRows: number;
  let pasteCols: number;

  switch (shape) {
    case PasteShape.SINGLE_CELL:
      // Expand from the anchor cell; clip at table boundaries
      pasteRows = Math.min(dataRows, numDataRows - startRow);
      pasteCols = Math.min(dataCols, numCols - startColIdx);
      break;
    case PasteShape.EXACT:
      pasteRows = targetRowCount;
      pasteCols = targetColCount;
      break;
    case PasteShape.SMALLER:
      // Tile to fill the selection if it's an even multiple
      pasteRows = targetRowCount;
      pasteCols = targetColCount;
      break;
    case PasteShape.LARGER:
      // Truncate to fit
      pasteRows = Math.min(dataRows, targetRowCount);
      pasteCols = Math.min(dataCols, targetColCount);
      break;
  }

  for (let r = 0; r < pasteRows; r++) {
    const dataRow = startRow + r;
    if (dataRow >= numDataRows) break;
    // For SMALLER shape, wrap around the source data rows
    const srcR = dataRows > 0 ? r % dataRows : 0;
    const row = parsed[srcR];
    if (row == null) continue;

    for (let c = 0; c < pasteCols; c++) {
      const colIdx = startColIdx + c;
      if (colIdx >= numCols) break;
      // Wrap around source columns for tiling
      const srcC = dataCols > 0 ? c % dataCols : 0;
      const value = row[srcC] ?? "";
      edits.push({
        rowIndex: dataRow,
        columnKey: ctx.columnSpec[colIdx].key,
        value,
      });
    }
  }
  return edits;
}

/** Paste tab-separated text from the clipboard into the table.
 *
 * Follows Excel-style paste semantics:
 * - **Single-cell selection**: Anchors the paste at the focused cell and
 *   expands to accommodate the full clipboard data, clipping at table edges.
 * - **Matching region**: Pastes one-to-one into the selected cells.
 * - **Selection larger than data**: Tiles the data to fill the selection
 *   when the selection is an even multiple; otherwise pastes once from the
 *   top-left corner.
 * - **Selection smaller than data**: Truncates the pasted data to fit.
 *
 * When a `ClipboardProxy` is stored and the clipboard text matches,
 * the proxy metadata is available for consumers to detect same-table
 * pastes and optionally delegate to the backend. */
export const pasteAction: TableAction = {
  id: "paste",
  name: "Paste",
  icon: "bring-data",
  hotkey: "mod+v",
  targets: [
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: true,
  async run(ctx) {
    const text = await navigator.clipboard.readText();
    if (!text) return;

    const parsed = parseTSV(text);
    if (parsed.length === 0) return;

    const cardinality =
      ctx.selectionCardinality ?? RegionCardinality.FULL_TABLE;
    const numDataRows = Math.max(ctx.data.length, ctx.updatedData.length);
    const numCols = ctx.columnSpec.length;

    // Determine the target region
    const rowIndices = ctx.getSelectedRowIndices();
    const columnKeys = ctx.getSelectedColumnKeys();

    let startRow: number;
    let startColIdx: number;
    let targetRowCount: number;
    let targetColCount: number;

    switch (cardinality) {
      case RegionCardinality.CELLS: {
        startRow = rowIndices[0] ?? 0;
        startColIdx =
          columnKeys.length > 0
            ? ctx.columnSpec.findIndex((c) => c.key === columnKeys[0])
            : 0;
        targetRowCount = rowIndices.length;
        targetColCount = columnKeys.length;
        break;
      }
      case RegionCardinality.FULL_ROWS: {
        startRow = rowIndices[0] ?? 0;
        startColIdx = 0;
        targetRowCount = rowIndices.length;
        targetColCount = numCols;
        break;
      }
      case RegionCardinality.FULL_COLUMNS: {
        startRow = 0;
        startColIdx =
          columnKeys.length > 0
            ? ctx.columnSpec.findIndex((c) => c.key === columnKeys[0])
            : 0;
        targetRowCount = numDataRows;
        targetColCount = columnKeys.length;
        break;
      }
      default: {
        // FULL_TABLE
        startRow = 0;
        startColIdx = 0;
        targetRowCount = numDataRows;
        targetColCount = numCols;
        break;
      }
    }

    if (startColIdx < 0) startColIdx = 0;

    const shape = getPasteShape(parsed, targetRowCount, targetColCount);
    const edits = buildPasteEdits(
      parsed,
      startRow,
      startColIdx,
      targetRowCount,
      targetColCount,
      shape,
      ctx,
    );

    if (edits.length > 0) {
      ctx.editCells(edits);
    }
  },
};

/** Convenience array of clipboard-related actions. */
export const clipboardActions: TableAction[] = [
  copyAction,
  cutAction,
  pasteAction,
];
