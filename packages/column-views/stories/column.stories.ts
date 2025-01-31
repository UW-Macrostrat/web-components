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
  t_age?: number;
  b_age?: number;
}

function useColumnUnits(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long" },
    (res) => res.success.data
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

  let units1 = units;
  if (props.t_age != null) {
    units1 = units.filter((d) => d.t_age >= props.t_age);
  }
  if (props.b_age != null) {
    units1 = units1.filter((d) => d.b_age <= props.b_age);
  }

  const data = preprocessUnits(units1);

  return h("div", [h("h2", info.col_name), h(Column, { ...props, data })]);
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

export const FilteredToAgeRange: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    t_age: 0,
    b_age: 66,
  },
};
