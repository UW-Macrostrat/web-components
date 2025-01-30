import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";
import { useAPIResult } from "@macrostrat/ui-components";

import { Column, preprocessUnits } from "../src";
import { Spinner } from "@blueprintjs/core";
import { PatternProvider } from "@macrostrat/column-components/stories/base-section";

interface ColumnProps {
  id: number;
  name: string;
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

function BasicColumn(props: ColumnProps) {
  const units = useColumnUnits(props.id);

  if (units == null) {
    return h(Spinner);
  }

  console.log(units);

  return h(Column, { data: units });
}

const meta: Meta<ColumnProps> = {
  title: "Column views/Stratigraphic columns",
  component: BasicColumn,
  args: {
    id: 432,
    name: "Western Illinois",
  },
  decorators: [
    (Story) => {
      return h(PatternProvider, h(Story));
    },
  ],
};

export default meta;

export function WesternIllinois() {
  return h(BasicColumn, { id: 432, name: "Western Illinois" });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
