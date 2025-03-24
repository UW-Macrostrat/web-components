import { MapViewProps } from "@macrostrat/map-interface";
import {
  useMapClickHandler,
  useMapEaseTo,
  useMapStyleOperator,
} from "@macrostrat/mapbox-react";
import h from "@macrostrat/hyper";
import { Feature, FeatureCollection } from "geojson";
import { ReactNode, useMemo } from "react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";

import { useColumnNavigationStore } from "./state";
import { InsetMap } from "../_shared";
import { buildCrossSectionLayers } from "@macrostrat/map-styles";

export interface CorrelationMapProps extends MapViewProps {
  padding?: number;
  children?: ReactNode;
  accessToken?: string;
}

export function ColumnNavigationMap(props: CorrelationMapProps) {
  const { padding = 50, children, ...rest } = props;

  return h(
    InsetMap,
    {
      ...rest,
      boxZoom: false,
      dragRotate: false,
      overlayStyles: _overlayStyles,
    },
    [h(ColumnsLayer), h(MapClickHandler), children]
  );
}

function MapClickHandler() {
  const onClickMap = useColumnNavigationStore((state) => state.onClickMap);

  useMapClickHandler(
    (e) => {
      onClickMap(e, { type: "Point", coordinates: e.lngLat.toArray() });
    },
    [onClickMap]
  );

  return null;
}

function ColumnsLayer({ enabled = true }) {
  const columns = useColumnNavigationStore((state) => state.columns);

  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };

      console.log("Setting columns", data);
      setGeoJSON(map, "columns", data);
    },
    [columns, enabled]
  );
  return null;
}

const columnsStyle = {
  sources: {
    columns: buildGeoJSONSource(),
  },
  layers: [
    {
      id: "columns-fill",
      type: "fill",
      source: "columns",
      paint: {
        "fill-color": "rgba(0, 0, 0, 0.1)",
      },
    },
    {
      id: "columns-line",
      type: "line",
      source: "columns",
      paint: {
        "line-color": "rgba(0, 0, 0, 0.5)",
        "line-width": 2,
      },
    },
    {
      id: "columns-points",
      type: "circle",
      source: "columns",
      paint: {
        "circle-radius": 4,
        "circle-color": "rgba(0, 0, 0, 0.5)",
      },
      filter: ["==", "$type", "Point"],
    },
  ],
};

const selectedColumnsStyle = {
  sources: {
    "selected-columns": buildGeoJSONSource(),
    "selected-column-centroids": buildGeoJSONSource(),
  },
  layers: [
    {
      id: "selected-columns-fill",
      type: "fill",
      source: "selected-columns",
      paint: {
        "fill-color": "rgba(255, 0, 0, 0.1)",
      },
    },
    {
      id: "selected-column-centroids-line",
      type: "line",
      source: "selected-column-centroids",
      paint: {
        "line-color": "rgba(255, 0, 0, 0.8)",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    },
    {
      id: "selected-column-centroids-points",
      type: "circle",
      source: "selected-column-centroids",
      paint: {
        "circle-radius": 4,
        "circle-color": "rgba(255, 0, 0, 0.8)",
      },
    },
  ],
};

const lineOfSectionStyle = {
  sources: {
    elevationMarker: buildGeoJSONSource(),
    crossSectionLine: buildGeoJSONSource(),
    crossSectionEndpoints: buildGeoJSONSource(),
  },
  layers: buildCrossSectionLayers(),
};

const _overlayStyles = [columnsStyle, selectedColumnsStyle, lineOfSectionStyle];

function buildGeoJSONSource(data: FeatureCollection | null = null) {
  return {
    type: "geojson",
    data: data ?? {
      type: "FeatureCollection",
      features: [],
    },
  };
}
