import {
  ColoredUnitComponent,
  ColumnNavigationMap,
  MacrostratDataProvider,
  MeasurementDataProvider,
  SGPMeasurementsColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { Meta } from "@storybook/react-vite";
import { FlexRow } from "@macrostrat/ui-components";
import { useColumnSelection } from "../column-ui/utils";

function SGPMeasurementsDemoColumn(props) {
  const { id, children, ...rest } = props;

  return h(
    MacrostratDataProvider,
    h(
      StandaloneColumn,
      {
        id,
        showTimescale: false,
        showLabelColumn: false,
        allowUnitSelection: false,
        ...rest,
      },
      h(SGPMeasurementsColumn, { columnID: id }),
    ),
  );
}

export default {
  title: "Column views/Facets/SGP Samples",
  component: SGPMeasurementsDemoColumn,
  tags: ["!autodocs"],
  argTypes: {
    axisType: {
      options: ["age", "depth"],
      control: { type: "radio" },
    },
    columnID: {
      control: {
        type: "number",
      },
    },
  },
  args: {
    columnID: 432,
  },
} as Meta;

export const ParadoxBasin = {
  args: {
    id: 495,
  },
};

export const UintaBasin = {
  args: {
    id: 502,
  },
};

export const BighornBasinColored = {
  args: {
    id: 515,
    showTimescale: true,
    allowUnitSelection: true,
    unitComponent: ColoredUnitComponent,
    spectraColor: "lightgreen",
    showUnitPopover: true,
    collapseSmallUnconformities: true,
    keyboardNavigation: true,
  },
};

export const BonnetPlumeBasinColored = {
  args: {
    id: 1657,
    showTimescale: true,
    allowUnitSelection: true,
    unitComponent: ColoredUnitComponent,
    spectraColor: "lightgreen",
    showUnitPopover: true,
    collapseSmallUnconformities: true,
    keyboardNavigation: true,
  },
};

export function SGPCompilationWithNavigation(defaultArgs) {
  const { columnID, setColumn } = useColumnSelection();

  return h(
    MacrostratDataProvider,
    h(MeasurementDataProvider, { col_id: columnID }, [
      h("h2", "Macrostrat columns matched to SGP samples"),
      h(FlexRow, { className: "column-ui", margin: "2em", gap: "1em" }, [
        h(ColumnNavigationMap, {
          style: { width: 400, height: 500 },
          onSelectColumn: (e) => setColumn(e),
          selectedColumn: columnID,
          accessToken: import.meta.env.VITE_MAPBOX_API_TOKEN,
        }),
        h(
          StandaloneColumn,
          {
            id: columnID,
            showLabelColumn: false,
            showTimescale: true,
            allowUnitSelection: true,
            unitComponent: ColoredUnitComponent,
            showUnitPopover: true,
            collapseSmallUnconformities: true,
            keyboardNavigation: true,
          },
          h(SGPMeasurementsColumn, { columnID }),
        ),
      ]),
    ]),
  );
}
