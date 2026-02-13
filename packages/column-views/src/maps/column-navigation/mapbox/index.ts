import { useMapStyleOperator, useOverlayStyle } from "@macrostrat/mapbox-react";
import h from "@macrostrat/hyper";
import { FeatureCollection } from "geojson";
import { ReactNode, useRef } from "react";
import { buildColumnsStyle, InsetMapProps } from "../../_shared";
import { setGeoJSON } from "@macrostrat/mapbox-utils";

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
import { StyleSpecification } from "mapbox-gl";

export interface ColumnNavigationMapProps extends InsetMapProps {
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
  props: ColumnNavigationMapProps & NavigationProviderProps,
) {
  const {
    columns,
    columnIDs,
    onSelectColumn,
    onHoverColumn,
    selectedColumn,
    hoveredColumn,
    projectID,
    children,
    inProcess,
    ...rest
  } = props;

  return h(
    ColumnNavigationProvider,
    {
      columns,
      columnIDs,
      onSelectColumn,
      onHoverColumn,
      selectedColumn,
      hoveredColumn,
      projectID,
      inProcess,
    },
    h(_ColumnNavigationMap, props),
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

  return h(
    InsetMap,
    {
      ...rest,
      boxZoom: false,
      dragRotate: false,
    },
    [
      h(ColumnsLayer, { color: columnColor }),
      h.if(keyboardNavigation)(ColumnKeyboardNavigation, { showTriangulation }),
      children,
    ],
  );
}

function ColumnsLayer({ enabled = true, color }) {
  const columns = useColumnNavigationStore((state) => state.columns);
  const selectedColumn = useColumnNavigationStore(
    (state) => state.selectedColumn,
  );
  const hoveredColumn = useColumnNavigationStore(
    (state) => state.hoveredColumn,
  );
  const selectColumn = useColumnNavigationStore((state) => state.selectColumn);
  const setHoveredColumn = useColumnNavigationStore(
    (state) => state.setHoveredColumn,
  );

  /** Add the column overlay style to the map */
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
    [columns, enabled],
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
          { hover: false },
        );
      }
      hoveredColumnRef.current = hoveredColumn;
      // Select the current column
      map.setFeatureState(
        { source: "columns", id: hoveredColumn },
        { hover: true },
      );
    },
    [hoveredColumn, columns],
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
          { selected: false },
        );
      }

      selectedColumnRef.current = selectedColumn;

      // Select the current column
      map.setFeatureState(
        { source: "columns", id: selectedColumn },
        { selected: true },
      );

      // Center the selected column
      const columnGeometry = columns.find(
        (d) => d.id == selectedColumn,
      )?.geometry;
      if (columnGeometry == null) return;
      const center = geoCentroid(columnGeometry);

      const isInitialRender = initialRenderRef.current;

      map.easeTo({ center }, { duration: isInitialRender ? 0 : 500 });
      if (isInitialRender) {
        initialRenderRef.current = false;
      }
    },
    [selectedColumn, columns],
  );

  return null;
}
