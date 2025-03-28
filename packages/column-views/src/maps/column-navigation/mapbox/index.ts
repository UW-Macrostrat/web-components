import { MapViewProps } from "@macrostrat/map-interface";
import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import h from "@macrostrat/hyper";
import { FeatureCollection } from "geojson";
import { ReactNode, useMemo, useRef } from "react";
import { setGeoJSON, buildGeoJSONSource } from "@macrostrat/mapbox-utils";

import {
  ColumnNavigationProvider,
  NavigationProviderProps,
  useColumnNavigationStore,
} from "./state";
import { InsetMap } from "../../_shared";
import { geoCentroid } from "d3-geo";
import {
  ColumnKeyboardNavigation,
  buildKeyboardNavigationStyle,
} from "./keyboard-navigation";

export interface ColumnNavigationMapProps extends MapViewProps {
  padding?: number;
  children?: ReactNode;
  accessToken?: string;
  selectedColumn?: number;
  hoveredColumn?: number;
  onSelectColumn?: (colID: number | null) => void;
  onHoverColumn?: (colID: number | null) => void;
  showTriangulation?: boolean;
  columnColor?: string;
  triangulationColor?: string;
  keyboardNavigation?: boolean;
}

export function ColumnNavigationMap(
  props: ColumnNavigationMapProps & NavigationProviderProps
) {
  const {
    columns,
    onSelectColumn,
    onHoverColumn,
    selectedColumn,
    hoveredColumn,
    projectID,
    inProcess,
    ...rest
  } = props;

  return h(
    ColumnNavigationProvider,
    {
      columns,
      onSelectColumn,
      onHoverColumn,
      selectedColumn,
      hoveredColumn,
      projectID,
      inProcess,
    },
    h(_ColumnNavigationMap, rest)
  );
}

function _ColumnNavigationMap(props: ColumnNavigationMapProps) {
  const {
    padding = 50,
    children,
    columnColor,
    showTriangulation,
    triangulationColor,
    keyboardNavigation = true,
    ...rest
  } = props;

  const overlayStyles = useMemo(() => {
    let styles: any[] = [buildColumnsStyle(columnColor)];
    if (showTriangulation) {
      styles.push(buildKeyboardNavigationStyle(triangulationColor));
    }
    return styles;
  }, [columnColor, showTriangulation, triangulationColor]);

  return h(
    InsetMap,
    {
      ...rest,
      boxZoom: false,
      dragRotate: false,
      overlayStyles,
    },
    [
      h(ColumnsLayer),
      h.if(keyboardNavigation)(ColumnKeyboardNavigation, { showTriangulation }),
      children,
    ]
  );
}

function ColumnsLayer({ enabled = true }) {
  const columns = useColumnNavigationStore((state) => state.columns);
  const selectedColumn = useColumnNavigationStore(
    (state) => state.selectedColumn
  );
  const hoveredColumn = useColumnNavigationStore(
    (state) => state.hoveredColumn
  );
  const selectColumn = useColumnNavigationStore((state) => state.selectColumn);
  const setHoveredColumn = useColumnNavigationStore(
    (state) => state.setHoveredColumn
  );

  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };

      console.log("Setting columns", columns);
      setGeoJSON(map, "columns", data);

      const mouseMove = (event) => {
        if (event.features.length == 0) return;
        const hoveredFeature = event.features[0];
        setHoveredColumn(hoveredFeature.id);
        map.getCanvas().style.cursor = "pointer";
      };
      const mouseLeave = () => {
        setHoveredColumn(null);
        map.getCanvas().style.cursor = "";
      };

      const clickHandler = (event) => {
        if (event.features.length == 0) return;
        const selectedColumn = event.features[0];
        const id = selectedColumn.id;
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

  const hoveredColumnRef = useRef(null);
  useMapStyleOperator(
    (map) => {
      const prevHoveredColumn = hoveredColumnRef.current;
      if (hoveredColumn == prevHoveredColumn) return;
      if (prevHoveredColumn != null) {
        // Deselect previous column
        map.setFeatureState(
          { source: "columns", id: prevHoveredColumn },
          { hover: false }
        );
      }
      hoveredColumnRef.current = hoveredColumn;
      // Select the current column
      map.setFeatureState(
        { source: "columns", id: hoveredColumn },
        { hover: true }
      );
    },
    [hoveredColumn, columns]
  );

  /** Set feature state for selected columns */
  const selectedColumnRef = useRef(null);
  const initialRenderRef = useRef(true);
  useMapStyleOperator(
    (map) => {
      if (columns == null) return;
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

      const isInitialRender = initialRenderRef.current;
      map.easeTo({ center }, { duration: isInitialRender ? 0 : 500 });
      if (isInitialRender) {
        initialRenderRef.current = false;
      }
    },
    [selectedColumn, columns]
  );

  return null;
}

function buildColumnsStyle(columnColor: string = "black") {
  return {
    sources: {
      columns: buildGeoJSONSource(),
    },
    layers: [
      {
        id: "columns-fill",
        type: "fill",
        source: "columns",
        paint: {
          "fill-color": columnColor,
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
          "line-color": columnColor,
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
          "circle-color": columnColor,
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1,
            ["boolean", ["feature-state", "hover"], false],
            0.7,
            0.5,
          ],
        },
        filter: ["==", "$type", "Point"],
      },
    ],
  };
}
