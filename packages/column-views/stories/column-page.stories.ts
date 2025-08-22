import hyper from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  ModalUnitPanel,
  UnitDetailsFeature,
} from "../src";
import { useColumnBasicInfo, useColumnUnits } from "./column-ui/utils";
import styles from "./column-page.stories.module.sass";
import { UnitLong } from "@macrostrat/api-types";
import { useArgs } from "storybook/preview-api";

export default {
  title: "Column views/Column page",
  component: ColumnStoryUI,
  args: {
    columnID: 494,
    selectedUnitID: 15160,
  },
} as Meta<typeof ColumnStoryUI>;

function Template(args) {
  return h(ColumnStoryUI, {
    ...args,
    ...useColumnSelection(),
  });
}

export const Primary = Template.bind({});

const h = hyper.styled(styles);

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function ColumnStoryUI({
  columnID,
  setColumnID,
  setSelectedUnitID,
  selectedUnitID,
  inProcess,
  projectID,
  ...rest
}) {
  const units: UnitLong[] = (useColumnUnits(columnID, inProcess) as any) ?? [];
  const info = useColumnBasicInfo(columnID, inProcess);

  // Sync props with internal state
  const selectedUnit = units?.find((d) => d.unit_id === selectedUnitID) ?? null;

  return h("div.column-ui", [
    h("div.column-container", [
      h("h2", info?.col_name),
      h(Column, {
        key: columnID,
        units,
        selectedUnit: selectedUnitID,
        onUnitSelected: setSelectedUnitID,
        unconformityLabels: true,
        keyboardNavigation: true,
        columnWidth: 300,
        showUnitPopover: false,
        width: 450,
        unitComponent: ColoredUnitComponent,
        collapseSmallUnconformities: false,
        targetUnitHeight: 20,
        ...rest,
      }),
    ]),
    h("div.right-column", [
      h(ColumnNavigationMap, {
        inProcess,
        projectID,
        accessToken: mapboxToken,
        selectedColumn: columnID,
        onSelectColumn: setColumnID,
        className: "column-selector-map",
      }),
      h.if(selectedUnit != null)(ModalUnitPanel, {
        unitData: units,
        className: "unit-details-panel",
        selectedUnit,
        onSelectUnit: setSelectedUnitID,
        features: new Set([
          UnitDetailsFeature.DepthRange,
          UnitDetailsFeature.JSONToggle,
        ]),
      }),
    ]),
  ]);
}

export function useColumnSelection() {
  const [{ columnID, selectedUnitID }, updateArgs] = useArgs();
  const setColumnID = (columnID) => {
    updateArgs({ columnID });
  };

  const setSelectedUnitID = (selectedUnitID) => {
    updateArgs({ selectedUnitID });
  };

  return {
    columnID,
    selectedUnitID,
    setColumnID,
    setSelectedUnitID,
  };
}
