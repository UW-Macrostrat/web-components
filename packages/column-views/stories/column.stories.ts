import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react";
import { DarkModeProvider, useAPIResult } from "@macrostrat/ui-components";

import { Column, preprocessUnits } from "../src";
import { Spinner } from "@blueprintjs/core";
import { PatternProvider } from "@macrostrat/column-components/stories/base-section";
import "@macrostrat/style-system";

interface ColumnProps {
  id: number;
  unconformityLabels?: boolean;
  showLabelColumn?: boolean;
}

function useColumnUnits(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long" },
    (res) => {
      return preprocessUnits(res.success.data);
    }
  );
}

function useColumnBasicInfo(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id },
    (res) => {
      return res.success.data[0];
    }
  );
}

function BasicColumn(props: ColumnProps) {
  const info = useColumnBasicInfo(props.id);
  const units = useColumnUnits(props.id);

  if (units == null || info == null) {
    return h(Spinner);
  }

  return h("div", [
    h("h2", info.col_name),
    h(Column, { ...props, data: units }),
  ]);
}

type Story = StoryObj<typeof BasicColumn>;

const meta: Meta<ColumnProps> = {
  title: "Column views/Stratigraphic columns",
  component: BasicColumn,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabels: true,
  },
  decorators: [
    (Story) => {
      return h(DarkModeProvider, h(PatternProvider, h(Story)));
    },
  ],
};

export default meta;

export const Primary: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
