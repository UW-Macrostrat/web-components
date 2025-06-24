import type { Meta, StoryObj } from "@storybook/react";
import hyper from "@macrostrat/hyper";
import styles from "./postgrest-sheet.stories.module.sass";
import {
  ColorCell,
  ColorPicker,
  notifyOnError,
  ScrollToRowControl,
  TrueColorCell,
  wrapWithErrorHandling,
} from "../src";
import {
  LongTextViewer,
  IntervalCell,
  lithologyRenderer,
  ExpandedLithologies,
  PostgRESTTableView,
} from "../src";
import { useSelector } from "../src/provider";
import { useRef, useState } from "react";
import { Button, InputGroup } from "@blueprintjs/core";
import {
  DataSheetAction,
  DataSheetActionsRow,
} from "../src/components/actions";
import { PostgrestClient } from "@supabase/postgrest-js";
import { useToaster } from "@macrostrat/ui-components";
import { ColorEditor } from "../src/__archive";

const h = hyper.styled(styles);

const endpoint = "https://dev.macrostrat.org/api/pg";

function TestPostgRESTView(props) {
  return h(
    "div.postgrest-sheet-container",
    h(PostgRESTTableView, {
      endpoint,
      table: "legend",
      order: { key: "legend_id", ascending: true },
      ...(props ?? {}),
    })
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

export const ReorderableColumns = {
  args: {
    columnOptions: defaultColumnOptions,
    enableColumnReordering: true,
  },
};

export const ScrollToRow = {
  args: {
    columnOptions: defaultColumnOptions,
    dataSheetActions: h(DataSheetActionsRow, [
      h(ScrollToRowControl),
      h(SelectLegendIDControl),
    ]),
  },
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
          cellComponent: TrueColorCell,
          dataEditor: ColorPicker,
        },
        symbol_color: {
          name: "Symbol color",
          cellComponent: TrueColorCell,
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

  return h(DataSheetAction, [
    h(InputGroup, {
      type: "number",
      placeholder: "Legend ID",
      value,
      onValueChange(value) {
        setValue(value);
      },
      rightElement: h(Button, {
        icon: "arrow-right",
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
    }),
  ]);
}
