import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";
import { JSONView, useAPIResult } from "@macrostrat/ui-components";

import {
  Column,
  LithologiesProvider,
  preprocessUnits,
  UnitSelectionProvider,
  useSelectedUnit,
  ColoredUnitComponent,
} from "@macrostrat/column-views";
import { Spinner } from "@blueprintjs/core";
import { PatternProvider } from "@macrostrat/column-components/stories/base-section";
import "@macrostrat/style-system";
import { ColumnProps as BaseColumnProps } from "@macrostrat/column-views";

const h = hyper.styled(styles);

interface ColumnProps extends BaseColumnProps {
  id: number;
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
      return h(LithologiesProvider, h(PatternProvider, h(Story)));
    },
  ],
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 700,
      },
    },
  },
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

export const Wide: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    t_age: 0,
    b_age: 66,
    width: 500,
    columnWidth: 500,
    unitComponentProps: {
      nColumns: 2,
    },
  },
};

function BasicUnitViewer() {
  const unit = useSelectedUnit();
  if (unit == null) {
    return null;
  }

  return h("div.unit-viewer", JSONView({ data: unit, showRoot: false }));
}

export function WithBasicUnitViewer() {
  return h(
    UnitSelectionProvider,
    h(BasicColumn, { id: 432, showLabelColumn: true }, [h(BasicUnitViewer)])
  );
}

export const WithUnitSelectionPopover: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    keyboardNavigation: true,
    showUnitPopover: true,
  },
};

export const ManyColumns: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    unitComponentProps: {
      nColumns: 8,
    },
    showUnitPopover: true,
  },
};

export const SuperWide: Story = {
  args: {
    id: 432,
    showLabelColumn: false,
    t_age: 0,
    b_age: 66,
    width: 600,
    columnWidth: 600,
    unitComponentProps: {
      nColumns: 5,
    },
    showUnitPopover: true,
    keyboardNavigation: true,
  },
};

export const MarysvilleUtah: Story = {
  args: {
    id: 483,
    showLabelColumn: true,
    width: 500,
    columnWidth: 500,
    unitComponentProps: {
      nColumns: 5,
    },
    showUnitPopover: true,
    keyboardNavigation: true,
  },
};

export const WithColoredUnits: Story = {
  args: {
    id: 483,
    showLabelColumn: false,
    width: 500,
    columnWidth: 500,
    unitComponent: ColoredUnitComponent,
    unitComponentProps: {
      nColumns: 5,
    },
    showUnitPopover: true,
    keyboardNavigation: true,
  },
};
