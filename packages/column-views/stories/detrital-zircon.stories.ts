import {
  MacrostratDataProvider,
  MeasurementDataProvider,
  SectionLabelsColumn,
  useMacrostratColumnData,
  useMacrostratUnits,
} from "../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "./column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { ColumnNavigationSVGMap, MeasurementsLayer } from "../src/maps";
import { useColumnNav } from "../src/data-provider";
import { useMemo } from "react";
import { FeatureCollection } from "geojson";
import { DetritalColumn } from "../src/detrital-zircon/detrital";
import { UnitDataColumn, UnitNamesColumn } from "../src/units/names";
import { SVG } from "@macrostrat/column-components";

function DetritalZirconColumn(props) {
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
      [h(DZColumn), h(DetritalColumn, { columnID: id })]
    )
  );
}

function DZColumn() {
  const { totalHeight, units } = useMacrostratColumnData();
  return h(
    SVG,
    { innerWidth: 200, height: totalHeight },
    h(UnitNamesColumn, {
      width: 200,
      divisions: units,
      shouldRenderNote() {
        return true;
      },
    })
  );
}

export default {
  title: "Column views/Facets/Detrital zircons",
  component: DetritalZirconColumn,
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
