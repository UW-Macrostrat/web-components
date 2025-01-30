import type { Meta, StoryObj } from "@storybook/react";
import hyper from "@macrostrat/hyper";
import styles from "./postgrest-sheet.stories.module.sass";
import { ColorCell, ScrollToRowControl } from "@macrostrat/data-sheet2";
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

const h = hyper.styled(styles);

const endpoint = "https://macrostrat.local/api/pg";

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

export function SelectLegendIDControl() {
  const [value, setValue] = useState("");
  const scrollToRow = useSelector((state) => state.scrollToRow);

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
          queryBuilder.current
            .from("legend")
            .select("count()")
            .lte("legend_id", value)
            .then((res) => {
              const rowCount = res.data[0].count;
              scrollToRow(rowCount - 1);
            });
        },
      }),
    }),
  ]);
}
