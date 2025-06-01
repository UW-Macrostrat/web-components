import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MeasurementDataProvider,
  MergeSectionsMode,
  ColumnNavigationSVGMap,
  MeasurementsLayer,
  useColumnNav,
  PBDBFossilsColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { useMemo } from "react";
import { FeatureCollection } from "geojson";

function PBDBFossilsDemoColumn(props) {
  const { id, children, spectraColor, ...rest } = props;

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
      h(PBDBFossilsColumn, { columnID: id, color: spectraColor })
    )
  );
}

export default {
  title: "Column views/Facets/Fossil occurrences",
  component: PBDBFossilsDemoColumn,
};

export const eODPColumn: Story = {
  args: {
    id: 5576,
    inProcess: true,
    collapseSmallUnconformities: false,
    mergeSections: MergeSectionsMode.OVERLAPPING,
  },
};

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
  },
};

export function DetritalZirconCompilation(defaultArgs) {
  const [columnArgs, setCurrentColumn] = useColumnNav({
    ...(defaultArgs ?? {}),
    col_id: 495,
  });

  const colParams = useMemo(
    () => ({ ...columnArgs, format: "geojson" }),
    [columnArgs]
  );
  const res: FeatureCollection = useAPIResult("/columns", colParams);
  const columnFeature = res?.features[0];

  return h(
    MacrostratDataProvider,
    h(MeasurementDataProvider, columnArgs, [
      h(FlexRow, { className: "column-ui", margin: "2em", gap: "1em" }, [
        h(
          ColumnNavigationSVGMap,
          {
            currentColumn: columnFeature,
            setCurrentColumn,
            margin: 0,
            style: { width: 400, height: 500 },
          },
          h(MeasurementsLayer, {
            measure_phase: "zircon",
            measurement: "207Pb-206Pb",
            style: { fill: "purple" },
          })
        ),
        h(DetritalZirconColumn, {
          id: columnArgs.col_id,
          showLabelColumn: false,
        }),
      ]),
    ])
  );
}
