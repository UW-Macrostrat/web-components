import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MeasurementDataProvider,
} from "../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "./column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { ColumnNavigationSVGMap, MeasurementsLayer } from "../src/maps";
import { useColumnNav } from "../src/data-provider";
import { useMemo } from "react";
import { FeatureCollection } from "geojson";
import { DetritalColumn } from "../src/detrital-zircon";

function DetritalZirconColumn(props) {
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
      h(DetritalColumn, { columnID: id, color: spectraColor })
    )
  );
}

export default {
  title: "Column views/Facets/Detrital zircons",
  component: DetritalZirconColumn,
};

export const PlateauProvince = {
  args: {
    id: 491,
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
