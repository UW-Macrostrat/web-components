import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "./postgrest-sheet.stories.module.sass";
import {
  ColorCell,
  ColorPicker,
  colorSwatchRenderer,
  createPostgRESTProvider,
  DataSheet,
  deleteRowsAction,
  ExpandedLithologies,
  IntervalCell,
  lithologyRenderer,
  LongTextViewer,
  PostgRESTTableView,
  scrollToRowAction,
  TableAction,
  wrapWithErrorHandling,
} from "../src";
import { useSelector } from "../src/provider";
import { useMemo, useRef, useState } from "react";
import { Button, InputGroup } from "@blueprintjs/core";
import { PostgrestClient } from "@supabase/postgrest-js";
import { useToaster } from "@macrostrat/ui-components";
import { RegionCardinality } from "@blueprintjs/table";

const endpoint = "https://dev.macrostrat.org/api/pg";

function TestPostgRESTView(props) {
  return h(
    "div.postgrest-sheet-container",
    h(PostgRESTTableView, {
      endpoint,
      table: "legend",
      order: { key: "legend_id", ascending: true },
      ...(props ?? {}),
    }),
  );
}

const defaultColumnOptions = {
  overrides: {
    source_id: "Source",
    liths: {
      name: "Lithologies",
      valueRenderer: lithologyRenderer,
      dataEditor: ExpandedLithologies,
    },
    name: "Unit name",
    lith: {
      dataEditor: LongTextViewer,
    },
    comments: "Comments",
    legend_id: "Legend ID",
    strat_name: "Stratigraphic names",
    b_interval: {
      name: "Lower",
      cellComponent: IntervalCell,
    },
    t_interval: {
      name: "Upper",
      cellComponent: IntervalCell,
    },
    color: {
      name: "Color",
      cellComponent: ColorCell,
    },
    descrip: {
      name: "Description",
      dataEditor: LongTextViewer,
    },
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/PostgREST sheet",
  component: TestPostgRESTView,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {
    columnOptions: defaultColumnOptions,
  },
};

export const Simple = {
  args: {},
};

export const FullTableSearch = {
  args: {
    name: "Table with full-text search",
    enableFullTableSearch: true,
  },
};

export const ReorderableColumns = {
  args: {
    columnOptions: defaultColumnOptions,
    enableColumnReordering: true,
  },
};

/** Column-level sort and filter controls backed by PostgREST queries.
 * Sorting and filtering are auto-inferred from column data types, with
 * type-appropriate operators (e.g., numeric columns get >/< but not
 * "contains"). Click a column header menu icon to configure. Active
 * sort/filter state is shown in a bar above the table. */
export const SortAndFilter = {
  args: {
    columnOptions: {
      overrides: {
        ...defaultColumnOptions.overrides,
        // Override to restrict source_id to equality only
        source_id: {
          name: "Source",
          filterable: { operators: ["eq", "neq"] },
        },
      },
    },
  },
};

/** Story-local example of a custom table-scoped action (jump to a legend id). */
const selectLegendIdAction: TableAction = {
  id: "select-legend-id",
  name: "Legend ID",
  icon: "flow-review",
  targets: [RegionCardinality.FULL_TABLE, "none"],
  requiresEditable: false,
  render: () => h(SelectLegendIDControl),
};

export const ScrollToRow = {
  args: {
    columnOptions: defaultColumnOptions,
    // Table-scoped controls are ordinary actions now (no `dataSheetActions`).
    actions: [scrollToRowAction, selectLegendIdAction],
  },
};

/**
 * **Deletion gated by the provider.** This table is editable and driven by a
 * PostgREST provider built with `createPostgRESTProvider`, but with `deleteRows`
 * **removed** from the provider object. Because the provider can't delete, the
 * "Delete rows" action is greyed out and the Delete/Backspace key is a no-op —
 * deletion is disabled table-wide. (Editing still works; drop `deleteRows` back
 * in and deletion returns.)
 */
function NoRowDeletionDemo() {
  const provider = useMemo(() => {
    const full = createPostgRESTProvider({
      endpoint,
      table: "legend",
      identityKey: "legend_id",
      baseOrder: [{ key: "legend_id", ascending: true }],
    });
    // Omit `deleteRows` → the sheet reports deletion as unavailable.
    const { deleteRows, ...withoutDelete } = full;
    return withoutDelete;
  }, []);

  return h(
    "div.postgrest-sheet-container",
    h(DataSheet, {
      provider,
      editable: true,
      columnSpecOptions: defaultColumnOptions,
      // Surface the delete action so you can see it disabled.
      actions: [deleteRowsAction],
    }),
  );
}

export const NoRowDeletion: StoryObj = {
  render: () => h(NoRowDeletionDemo),
};

export const MapboardPostgrestView = {
  args: {
    endpoint: "https://mapboard.local/pg-api",
    table: "polygon_type",
    editable: true,
    order: { key: "id", ascending: true },
    filter(query) {
      return query
        .eq("data_schema", "map_digitizer")
        .eq("project_slug", "naukluft");
    },
    columns: ["id", "name", "symbol", "color", "symbol_color"],
    columnOptions: {
      overrides: {
        id: {
          editable: false,
        },
        color: {
          name: "Color",
          valueRenderer: colorSwatchRenderer,
          dataEditor: ColorPicker,
        },
        symbol_color: {
          name: "Symbol color",
          valueRenderer: colorSwatchRenderer,
          dataEditor: ColorPicker,
        },
      },
    },
  },
};

function SelectLegendIDControl() {
  const [value, setValue] = useState("");
  const scrollToRow = useSelector((state) => state.scrollToRow);

  const toaster = useToaster();
  // This should be provided by the table context
  const queryBuilder = useRef(new PostgrestClient(endpoint));

  return h(InputGroup, {
    type: "number",
    placeholder: "Legend ID",
    small: true,
    value,
    onValueChange(value) {
      setValue(value);
    },
    rightElement: h(Button, {
      icon: "arrow-right",
      minimal: true,
      small: true,
      onClick() {
        // Get offset
        const query = queryBuilder.current
          .from("legend")
          .select("count()")
          .lte("legend_id", value);

        wrapWithErrorHandling(toaster, query).then((res) => {
          if (!res?.data) return null;
          const rowCount = res.data[0].count;
          scrollToRow(rowCount - 1);
        });
      },
    }),
  });
}
