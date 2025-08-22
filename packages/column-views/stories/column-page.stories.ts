import hyper from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import { useColumnSelection } from "./column-ui/utils";
import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  ModalUnitPanel,
} from "../src";
import { useColumnBasicInfo, useColumnUnits } from "./column-ui/utils";
import styles from "./column-page.stories.module.sass";
import { UnitLong } from "@macrostrat/api-types";
import { useCallback } from "react";

export default {
  title: "Column views/Column page",
  component: ColumnStoryUI,
  args: {
    columnID: 432,
    axisType: "age",
    collapseSmallUnconformities: false,
    targetUnitHeight: 20,
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
  setColumn,
  selectedUnit,
  setSelectedUnit,
  inProcess,
  projectID,
  ...rest
}) {
  const units: UnitLong[] = (useColumnUnits(columnID, inProcess) as any) ?? [];
  const info = useColumnBasicInfo(columnID, inProcess);

  const setSelectedUnitID = useCallback(
    (unit_id) => {
      setSelectedUnit(units?.find((u) => u.unit_id == unit_id));
    },
    [units, setSelectedUnit],
  );

  console.log(selectedUnit, rest);

  return h("div.column-ui", [
    h("div.column-container", [
      h("h2", info?.col_name),
      h(Column, {
        key: columnID,
        units,
        selectedUnit: selectedUnit?.unit_id,
        onUnitSelected: setSelectedUnitID,
        unconformityLabels: true,
        keyboardNavigation: true,
        columnWidth: 300,
        showUnitPopover: false,
        width: 450,
        unitComponent: ColoredUnitComponent,
        ...rest,
      }),
    ]),
    h("div.right-column", [
      h(ColumnNavigationMap, {
        inProcess,
        projectID,
        accessToken: mapboxToken,
        selectedColumn: columnID,
        onSelectColumn: setColumn,
        className: "column-selector-map",
      }),
      h.if(selectedUnit != null)(ModalUnitPanel, {
        unitData: units,
        className: "unit-details-panel",
        selectedUnit,
        onSelectUnit: setSelectedUnitID,
      }),
    ]),
  ]);
}
