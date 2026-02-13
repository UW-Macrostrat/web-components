import {
  useMapClickHandler,
  useMapEaseTo,
  useMapStyleOperator,
  useOverlayStyle,
} from "@macrostrat/mapbox-react";
import { LngLatBounds, Style } from "mapbox-gl";
import h from "@macrostrat/hyper";
import { Feature, FeatureCollection } from "geojson";
import { ReactNode, useMemo } from "react";
import { setGeoJSON, buildGeoJSONSource } from "@macrostrat/mapbox-utils";

import { useCorrelationMapStore } from "./state";
import { buildColumnsStyle, InsetMap, InsetMapProps } from "../_shared";
import { buildCrossSectionLayers } from "@macrostrat/map-styles";

export interface CorrelationMapProps extends InsetMapProps {
  padding?: number;
  children?: ReactNode;
  accessToken?: string;
  columnColor?: string;
}

export function ColumnCorrelationMap(props: CorrelationMapProps) {
  const { padding = 50, children, columnColor, projectID, ...rest } = props;

  return h(
    InsetMap,
    {
      ...rest,
      boxZoom: false,
      dragRotate: false,
    },
    [
      h(ColumnsLayer, { color: columnColor }),
      h(SelectedColumnsLayer),
      h(MapClickHandler),
      h(SectionLine, { padding }),
      children,
    ],
  );
}

function MapClickHandler() {
  const onClickMap = useCorrelationMapStore((state) => state.onClickMap);

  useMapClickHandler(
    (e) => {
      onClickMap(e, { type: "Point", coordinates: e.lngLat.toArray() });
    },
    [onClickMap],
  );

  return null;
}

function SelectedColumnsLayer() {
  useOverlayStyle(() => selectedColumnsStyle, []);

  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );

  useMapStyleOperator(
    (map) => {
      let features = focusedColumns;

      const data: FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      const columnCentroidLine: Feature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: features.map(
            (col) => col.properties.centroid.geometry.coordinates,
          ),
        },
        properties: {},
      };

      setGeoJSON(map, "selected-columns", data);
      setGeoJSON(map, "selected-column-centroids", {
        type: "FeatureCollection",
        features: [columnCentroidLine],
      });
    },
    [focusedColumns],
  );
  return null;
}

function ColumnsLayer({ enabled = true, color }) {
  const columns = useCorrelationMapStore((state) => state.columns);

  useOverlayStyle(() => buildColumnsStyle(color), [color]);

  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };

      console.log(" columns", data);
      setGeoJSON(map, "columns", data);
    },
    [columns, enabled],
  );
  return null;
}

const selectedColumnsStyle: Style = {
  version: 8,
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

const lineOfSectionStyle: Style = {
  version: 8,
  sources: {
    elevationMarker: buildGeoJSONSource(),
    crossSectionLine: buildGeoJSONSource(),
    crossSectionEndpoints: buildGeoJSONSource(),
  },
  layers: buildCrossSectionLayers(),
};

function SectionLine({ padding }: { padding: number }) {
  useOverlayStyle(() => lineOfSectionStyle, []);
  const focusedLine = useCorrelationMapStore((state) => state.focusedLine);

  // Setup focused line
  useMapStyleOperator(
    (map) => {
      if (focusedLine == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: focusedLine,
            properties: { id: "focusedLine" },
          },
        ],
      };

      setGeoJSON(map, "crossSectionLine", data);
      setGeoJSON(map, "crossSectionEndpoints", {
        type: "FeatureCollection",
        features: focusedLine.coordinates.map((coord) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: coord },
          properties: {},
        })),
      });
    },
    [focusedLine],
  );

  const bounds = useMemo(() => {
    if (focusedLine == null || focusedLine?.coordinates.length < 2) {
      return null;
    }
    let bounds = new LngLatBounds();
    for (let coord of focusedLine.coordinates) {
      bounds.extend(coord);
    }
    return bounds;
  }, [focusedLine]);

  useMapEaseTo({ bounds, padding, trackResize: true });

  return null;
}
