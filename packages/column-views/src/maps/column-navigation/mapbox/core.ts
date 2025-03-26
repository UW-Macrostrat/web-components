import { MapViewProps } from "@macrostrat/map-interface";
import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import h from "@macrostrat/hyper";
import { FeatureCollection } from "geojson";
import { ReactNode, useRef } from "react";
import { setGeoJSON, buildGeoJSONSource } from "@macrostrat/mapbox-utils";

import { useColumnNavigationStore } from "./state";
import { InsetMap } from "../../_shared";
import { buildCrossSectionLayers } from "@macrostrat/map-styles";
import { geoCentroid } from "d3-geo";
import {
  keyboardNavigationStyle,
  ColumnKeyboardNavigation,
} from "./keyboard-navigation";

export interface ColumnNavigationMapProps extends MapViewProps {
  padding?: number;
  children?: ReactNode;
  accessToken?: string;
}

export function ColumnNavigationMap(props: ColumnNavigationMapProps) {
  const { padding = 50, children, ...rest } = props;

  return h(
    InsetMap,
    {
      ...rest,
      boxZoom: false,
      dragRotate: false,
      overlayStyles: _overlayStyles,
    },
    [h(ColumnsLayer), h(ColumnKeyboardNavigation), children]
  );
}

function ColumnsLayer({ enabled = true }) {
  const columns = useColumnNavigationStore((state) => state.columns);
  const selectedColumn = useColumnNavigationStore(
    (state) => state.selectedColumn
  );
  const selectColumn = useColumnNavigationStore((state) => state.selectColumn);

  useMapStyleOperator(
    (map) => {
      let hoveredID: number | null = null;

      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };

      setGeoJSON(map, "columns", data);

      const removeFeatureState = () => {
        if (hoveredID == null) return;
        map.setFeatureState(
          { source: "columns", id: hoveredID },
          { hover: false }
        );
        hoveredID = null;
      };

      const mouseMove = (event) => {
        if (event.features.length == 0) return;
        const hoveredFeature = event.features[0];
        const newHoveredID = hoveredFeature.id;
        if (hoveredID != newHoveredID) {
          removeFeatureState();
        }
        map.setFeatureState(
          { source: "columns", id: newHoveredID },
          { hover: true }
        );
        map.getCanvas().style.cursor = "pointer";
        hoveredID = newHoveredID;
      };
      const mouseLeave = () => {
        removeFeatureState();
        map.getCanvas().style.cursor = "";
      };

      const clickHandler = (event) => {
        if (event.features.length == 0) return;
        const id = event.features[0].id;
        selectColumn(id);
      };

      // Setup hover styles on map
      const layers = ["columns-points", "columns-fill"];
      map.on("mousemove", layers, mouseMove);
      map.on("mouseleave", layers, mouseLeave);
      map.on("click", layers, clickHandler);

      return () => {
        map.off("mouseenter", layers, mouseMove);
        map.off("mouseleave", layers, mouseLeave);
        map.off("click", layers, clickHandler);
      };
    },
    [columns, enabled]
  );

  /** Set feature state for selected columns */
  const selectedColumnRef = useRef(selectedColumn);
  useMapStyleOperator(
    (map) => {
      const prevSelectedColumn = selectedColumnRef.current;
      if (selectedColumn == prevSelectedColumn) return;
      if (prevSelectedColumn != null) {
        // Deselect previous column
        map.setFeatureState(
          { source: "columns", id: prevSelectedColumn },
          { selected: false }
        );
      }

      selectedColumnRef.current = selectedColumn;

      // Select the current column
      map.setFeatureState(
        { source: "columns", id: selectedColumn },
        { selected: true }
      );

      // Center the selected column
      const columnGeometry = columns.find(
        (d) => d.id == selectedColumn
      )?.geometry;
      if (columnGeometry == null) return;
      const center = geoCentroid(columnGeometry);
      map.easeTo({ center }, { duration: 500 });
    },
    [selectedColumn, columns]
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
        "fill-color": "#000000",
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.5,
          ["boolean", ["feature-state", "hover"], false],
          0.3,
          0.1,
        ],
      },
    },
    {
      id: "columns-line",
      type: "line",
      source: "columns",
      paint: {
        "line-color": "rgb(0, 0, 0)",
        "line-width": 2,
        "line-opacity": 0.5,
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

const _overlayStyles = [
  columnsStyle,
  selectedColumnsStyle,
  lineOfSectionStyle,
  keyboardNavigationStyle,
];
