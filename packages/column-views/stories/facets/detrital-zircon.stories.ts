import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MeasurementDataProvider,
  ColumnNavigationMap,
  MeasurementsLayer,
  useColumnNav,
  DetritalColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { useMapRef } from "@macrostrat/mapbox-react";


function ColumnWithDetritalZirconFacet(props) {
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
  tags: ["!autodocs"],
  title: "Column views/Facets/Detrital zircons",
  component: ColumnWithDetritalZirconFacet,
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
  // const mapRef = useMapRef()

  return h(
    MacrostratDataProvider,
    h(MeasurementDataProvider, columnArgs, [
      h(FlexRow, { className: "column-ui", margin: "2em", gap: "1em" }, [
        h(ColumnNavigationMap, 
          {
            style: { width: 400, height: 500 },
            onSelectColumn: (e) => setCurrentColumn({
              ...(defaultArgs ?? {}),
              col_id: e
            }),
            selectedColumn: columnArgs?.col_id,
            accessToken: import.meta.env.VITE_MAPBOX_API_TOKEN,
          },
          h(MeasurementsLayer, {
            id: "measurements",
            measure_phase: "zircon",
            measurement: "207Pb-206Pb",
            style: { fill: "purple" },
          }),
        ),
        h(ColumnWithDetritalZirconFacet, {
          id: columnArgs.col_id,
          showLabelColumn: false,
        }),
      ]),
    ])
  );
}