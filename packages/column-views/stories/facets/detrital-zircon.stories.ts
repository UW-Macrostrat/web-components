import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MeasurementDataProvider,
  ColumnNavigationMap,
  ColumnNavigationSVGMap,
  MeasurementsLayer,
  useColumnNav,
  DetritalColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { useMemo, useState, useEffect } from "react";
import { FeatureCollection } from "geojson";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { useMapStyleOperator } from "@macrostrat/mapbox-react";


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
  tags: ["!autodocs"],
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
  const [mapInstance, setMapInstance] = useState(null);
  const [columnArgs, setCurrentColumn] = useColumnNav({
    ...(defaultArgs ?? {}),
    col_id: 495,
  });

  const handleMapLoaded = (map) => {
    setMapInstance(map);
  };

  const layer = h.if(mapInstance)(MeasurementsLayer, {
    id: "measurements",
    measure_phase: "zircon",
    measurement: "207Pb-206Pb",
    style: { fill: "purple" },
  });

  console.log("layer", layer);

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
            margin: 0,
            accessToken: import.meta.env.VITE_MAPBOX_API_TOKEN,
            onMapLoaded: handleMapLoaded, 
          },
          layer,
        ),
        h(DetritalZirconColumn, {
          id: columnArgs.col_id,
          showLabelColumn: false,
        }),
      ]),
    ])
  );
}

function getLayer(props) {
  const defaultStyle = {
    fill: "rgb(239, 180, 249)",
    stroke: "magenta",
  };
  const { style = defaultStyle, ...params } = props;

  console.log("/measurements", {
    ...params,
    format: "geojson",
    response: "light",
  })
  return useAPIResult("https://macrostrat.org/api/v2/measurements", {
    ...params,
    format: "geojson",
    response: "light",
  })?.success?.data
}