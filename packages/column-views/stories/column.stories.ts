import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";
import { JSONView, useAPIResult } from "@macrostrat/ui-components";

import { Column, ColoredUnitComponent } from "@macrostrat/column-views";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { ColumnProps as BaseColumnProps } from "@macrostrat/column-views";
import { useState } from "react";

const h = hyper.styled(styles);

interface ColumnProps extends Omit<BaseColumnProps, "units"> {
  id: number;
  inProcess?: boolean;
}

function useColumnUnits(col_id, inProcess) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code },
    (res) => res.success.data
  );
}

function useColumnBasicInfo(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id, status_code },
    (res) => {
      return res.success.data[0];
    }
  );
}

function BasicColumn(props: ColumnProps) {
  const { id, inProcess, ...rest } = props;
  const info = useColumnBasicInfo(id, inProcess);
  const units = useColumnUnits(id, inProcess);

  if (units == null || info == null) {
    return h(Spinner);
  }

  return h("div", [h("h2", info.col_name), h(Column, { ...rest, units })]);
}

type Story = StoryObj<typeof BasicColumn>;

const meta: Meta<ColumnProps> = {
  title: "Column views/Stratigraphic column rendering",
  component: BasicColumn,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabels: true,
  },
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

export function WithExternalUnitViewer() {
  const [unitID, setUnitID] = useState(13102);
  const [unit, setSelectedUnit] = useState(null);

  return h("div", [
    h(
      BasicColumn,
      {
        id: 432,
        showLabelColumn: true,
        selectedUnit: unitID,
        keyboardNavigation: true,
        onUnitSelected(unitID, unit) {
          setSelectedUnit(unit);
          setUnitID(unitID);
        },
      },
      h.if(unit != null)(
        "div.unit-viewer",
        h(JSONView, { data: unit, showRoot: false })
      )
    ),
  ]);
}

export const WithUnitSelectionPopover: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    keyboardNavigation: true,
    showUnitPopover: true,
  },
};

export function WithControlledPopover() {
  const [unitID, setUnitID] = useState(13102);
  const [unit, setSelectedUnit] = useState(null);

  return h("div", [
    h(BasicColumn, {
      id: 432,
      showLabelColumn: true,
      selectedUnit: unitID,
      onUnitSelected(unitID, unit) {
        setSelectedUnit(unit);
        setUnitID(unitID);
      },
      showUnitPopover: true,
      keyboardNavigation: true,
      unitComponentProps: {
        nColumns: 12,
      },
    }),
  ]);
}

export const SingleColumn: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    maxInternalColumns: 1,
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

export const BrokenAxis: Story = {
  args: {
    id: 69,
    showLabelColumn: false,
    width: 300,
    columnWidth: 500,
    t_age: 0,
    b_age: 210,
    targetUnitHeight: 50,
    timescaleLevels: 2,
    showUnitPopover: true,
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

export const eODPColumn: Story = {
  args: {
    id: 5576,
    width: 500,
    columnWidth: 500,
    showLabelColumn: false,
    inProcess: true,
    unitComponent: ColoredUnitComponent,
    unitComponentProps: {
      nColumns: 5,
    },
    showUnitPopover: true,
    keyboardNavigation: true,
  },
};

export const eODPColumnV2: Story = {
  args: {
    id: 5248,
    width: 500,
    columnWidth: 500,
    showLabelColumn: false,
    inProcess: true,
    unitComponent: ColoredUnitComponent,
    unitComponentProps: {
      nColumns: 5,
    },
    showUnitPopover: true,
    keyboardNavigation: true,
  },
};
