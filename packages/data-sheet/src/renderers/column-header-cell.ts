/**
 * Column header with client-side sort and filter controls.
 *
 * Mirrors the PostgREST column header UX but operates on in-memory data.
 * Sort state is stored in the DataSheet zustand store; filtering uses the
 * existing `setFilter` / `removeFilter` mechanism with auto-generated
 * predicate filters for simple text search.
 */
import h from "@macrostrat/hyper";
import { ColumnHeaderCell, RegionCardinality } from "@blueprintjs/table";
import { Icon, Menu, MenuItem } from "@blueprintjs/core";
import { ctx, storeAPIAtom, tableActionsAtom, useStoreAPI } from "../provider";
import type { ColumnSpec } from "../utils/column-spec";
import type {
  PostgrestColumnFilter,
  ColumnSortEntry,
} from "../postgrest-table";
import { buildActionContextLegacyAPI } from "../actions/context.ts";

export interface ColumnActionsConfig {
  activeSort?: ColumnSortEntry | null;
  activeFilter?: PostgrestColumnFilter | null;
}

export interface ColumnHeaderRendererProps extends ColumnActionsConfig {
  col: ColumnSpec;
  colIndex: number;
  //actions: ColumnHeaderActions;
}

// ---- Column header cell ----

/** Column header cell whose dropdown renders the `FULL_COLUMNS` controls
 * (sort/filter + any custom column actions) from the shared action registry,
 * scoped to this column. */
export function renderColumnHeaderCell({
  col,
  colIndex,
  activeSort,
  activeFilter,
}: ColumnHeaderRendererProps) {
  const isSortable = col.sortable === true;
  const isFilterable =
    col.filterable === true ||
    typeof col.filterable === "object" ||
    (Array.isArray(col.filters) && col.filters.length > 0);
  const hasCustomActions =
    Array.isArray((col as any).actions) && (col as any).actions.length > 0;

  // A column may be pinned against drag-reordering via `reorderable: false`.
  const enableColumnReordering = col.reorderable !== false;

  if (!isSortable && !isFilterable && !hasCustomActions) {
    return h(ColumnHeaderCell, {
      name: col.name,
      enableColumnReordering,
      nameRenderer: () =>
        h(ColumnHeaderName, {
          col,
          hasSortActive: false,
          hasFilterActive: false,
          activeSort: null,
        }),
    });
  }

  // `activeFilter` is the active store entry targeting this column (any filter
  // type), or null — so the indicator lights for rich and operator filters.
  const hasFilterActive = activeFilter != null;
  const hasSortActive = activeSort != null;

  return h(ColumnHeaderCell, {
    name: col.name,
    enableColumnReordering,
    // Persistent interaction bar so the menu caret is always clickable — the
    // hover-triggered caret was blocked by the selection overlay when the
    // column was selected.
    enableColumnInteractionBar: true,
    nameRenderer: () =>
      h(ColumnHeaderName, { col, hasSortActive, hasFilterActive, activeSort }),
    menuRenderer: () => h(ColumnHeaderControls, { colIndex }),
  });
}

/** Column name with active sort/filter indicator icons. The column key is
 * exposed as `data-column-key` so consumers can target a specific header from
 * CSS (e.g. to tint a column) without a bespoke styling prop. */
function ColumnHeaderName({ col, hasSortActive, hasFilterActive, activeSort }) {
  return h(
    "div",
    {
      "data-column-key": col.key,
      style: { display: "flex", alignItems: "center", width: "100%" },
    },
    [
      h(
        "span",
        {
          style: {
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        },
        col.name,
      ),
      h.if(hasSortActive || hasFilterActive)(
        "span",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "2px",
            marginLeft: "4px",
            flexShrink: 0,
          },
        },
        [
          h.if(hasSortActive)(Icon, {
            icon: activeSort?.ascending ? "sort-asc" : "sort-desc",
            size: 12,
            style: { color: "var(--intent-primary, #2965cc)" },
          }),
          h.if(hasFilterActive)(Icon, {
            icon: "filter",
            size: 12,
            style: { color: "var(--intent-primary, #2965cc)" },
          }),
        ],
      ),
    ],
  );
}

/** Dropdown content: the `FULL_COLUMNS` controls for this column, sourced from
 * the shared action registry and scoped to the column via a synthetic
 * single-column selection context — so the header and toolbar render the same
 * sort/filter (and custom column) controls. */
function ColumnHeaderControls({ colIndex }: { colIndex: number }) {
  //const storeAPI = useStoreAPI();
  const actions = ctx.useValue(tableActionsAtom);
  const store = ctx.useStore();
  const storeAPI = store.get(storeAPIAtom);

  // Scope the action context to this column (as if it were the selection).
  const actionCtx = buildActionContextLegacyAPI(
    {
      ...storeAPI.getState(),
      selection: [{ cols: [colIndex, colIndex], rows: undefined }],
    } as any,
    storeAPI.setState,
  );

  // Only actions *limited* to column scope belong in a column's dropdown —
  // sort/filter and column-specific actions. Global actions (Save / Reset /
  // Clear-selection, marked by a FULL_TABLE or "none" target) are confusing
  // here, so they're excluded even though they nominally apply to columns too.
  const isGlobal = (a: (typeof actions)[number]) =>
    a.targets.includes(RegionCardinality.FULL_TABLE) ||
    a.targets.includes("none" as any);
  const controls = actions.filter(
    (a) =>
      a.targets.includes(RegionCardinality.FULL_COLUMNS) &&
      !isGlobal(a) &&
      (a.appliesTo?.(actionCtx) ?? true),
  );

  // Prefer menu-native rendering (`renderMenuItem`) — sort/filter render as
  // items with submenus, so the whole dropdown is one Blueprint `Menu`. A
  // control that only has `render` (a live toolbar control) is embedded as-is;
  // a plain `run` action becomes a clickable item.
  const items = controls
    .map((a, i) => {
      if (a.renderMenuItem != null) return a.renderMenuItem(actionCtx);
      if (a.render != null)
        return h(
          "li.column-header-control",
          { key: a.id ?? i },
          a.render(actionCtx),
        );
      return h(MenuItem, {
        key: a.id ?? i,
        icon: a.icon,
        intent: a.intent,
        text: a.name,
        onClick: () => a.run?.(actionCtx),
      });
    })
    .filter(Boolean);

  if (items.length === 0) {
    return h(Menu, [h(MenuItem, { text: "No options", disabled: true })]);
  }

  return h(Menu, { className: "column-header-controls" }, items);
}
