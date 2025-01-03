import type { Meta, StoryObj } from "@storybook/react";
import hyper from "@macrostrat/hyper";
import styles from "./postgrest-sheet.stories.module.sass";
import { ColorCell } from "@macrostrat/data-sheet2";
import {
  LongTextViewer,
  IntervalCell,
  lithologyRenderer,
  ExpandedLithologies,
  PostgRESTTableView,
} from "../src";

const h = hyper.styled(styles);

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/PostgREST sheet",
  component: TestPostgRESTVIew,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {},
};

export function TestPostgRESTVIew() {
  return h(
    "div.postgrest-sheet-container",
    h(PostgRESTTableView, {
      endpoint: "https://dev2.macrostrat.org/api/pg",
      table: "legend",
      order: { key: "legend_id", ascending: true },
      columnOptions,
    })
  );
}

const columnOptions = {
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
