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
import { Button, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { ctx, tableActionsAtom, useStoreAPI } from "../provider";
import { buildActionContext } from "../actions/selection";
import type { ColumnSpec } from "../utils/column-spec";
import type {
  PostgrestColumnFilter,
  ColumnSortEntry,
} from "../postgrest-table";

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

  if (!isSortable && !isFilterable && !hasCustomActions) {
    return h(ColumnHeaderCell, { name: col.name });
  }

  // `activeFilter` is the active store entry targeting this column (any filter
  // type), or null — so the indicator lights for rich and operator filters.
  const hasFilterActive = activeFilter != null;
  const hasSortActive = activeSort != null;

  return h(ColumnHeaderCell, {
    name: col.name,
    // Persistent interaction bar so the menu caret is always clickable — the
    // hover-triggered caret was blocked by the selection overlay when the
    // column was selected.
    enableColumnInteractionBar: true,
    nameRenderer: () =>
      h(ColumnHeaderName, { col, hasSortActive, hasFilterActive, activeSort }),
    menuRenderer: () => h(ColumnHeaderControls, { colIndex }),
  });
}

/** Column name with active sort/filter indicator icons. */
function ColumnHeaderName({ col, hasSortActive, hasFilterActive, activeSort }) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", width: "100%" } },
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
            style: { color: "var(--intent-warning, #d99e0b)" },
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
  const storeAPI = useStoreAPI();
  const actions = ctx.useValue(tableActionsAtom);

  // Scope the action context to this column (as if it were the selection).
  const actionCtx = buildActionContext(
    {
      ...storeAPI.getState(),
      selection: [{ cols: [colIndex, colIndex], rows: undefined }],
    } as any,
    storeAPI.setState,
  );

  const controls = actions.filter(
    (a) =>
      a.targets.includes(RegionCardinality.FULL_COLUMNS) &&
      (a.appliesTo?.(actionCtx) ?? true),
  );

  const rendered = controls
    .map((a) =>
      a.render != null
        ? a.render(actionCtx)
        : h(
            Button,
            {
              key: a.id,
              small: true,
              minimal: true,
              icon: a.icon,
              intent: a.intent,
              onClick: () => a.run?.(actionCtx),
            },
            a.name,
          ),
    )
    .filter(Boolean);

  if (rendered.length === 0) {
    return h(Menu, [h(MenuItem, { text: "No options", disabled: true })]);
  }

  return h(
    "div.column-header-controls",
    {
      style: {
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        alignItems: "flex-start",
      },
    },
    rendered,
  );
}
