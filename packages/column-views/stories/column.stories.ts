import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";
import { FlexRow, JSONView } from "@macrostrat/ui-components";

import { ColoredUnitComponent } from "@macrostrat/column-views";
import "@macrostrat/style-system";
import { useState } from "react";
import { AgeCursor, AgeLabel } from "../src";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";

const h = hyper.styled(styles);

type Story = StoryObj<typeof StandaloneColumn>;

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Stratigraphic column rendering",
  component: StandaloneColumn,
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

export const WithoutTimescale = {
  args: {
    id: 2192,
    project_id: 10,
    inProcess: true,
    showTimescale: false,
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
      StandaloneColumn,
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
    h(StandaloneColumn, {
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

export function ColumnClickHandler() {
  const [hoveredHeight, setHoveredHeight] = useState(null);

  return h(FlexRow, { gap: "2em" }, [
    h(
      StandaloneColumn,
      {
        id: 483,
        showLabelColumn: false,
        width: 200,
        columnWidth: 200,
        unitComponent: ColoredUnitComponent,
        unitComponentProps: {
          nColumns: 5,
        },
        showUnitPopover: true,
        keyboardNavigation: true,
        onMouseOver(unit, height, event) {
          setHoveredHeight(height);
        },
      },
      h(AgeCursor, {
        age: hoveredHeight,
      })
    ),
    h("div.column-height-info", [
      h("h3", "Column height info"),
      h("p", "Hover over the column to see the height at that point."),
      h(
        "p",
        hoveredHeight
          ? h(AgeLabel, { age: hoveredHeight })
          : "No height selected"
      ),
    ]),
  ]);
}
