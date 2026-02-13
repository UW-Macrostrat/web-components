import { useMapRef, useMapStyleOperator } from "@macrostrat/mapbox-react";
import h from "@macrostrat/hyper";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ColumnNavigationProvider,
  NavigationProviderProps,
  useColumnNavigationStore,
} from "./state";
import { InsetMap, type InsetMapProps } from "../../inset-map";
import { geoCentroid } from "d3-geo";
import { BaseColumnsLayer } from "../../layers";
import { ColumnKeyboardNavigation } from "./keyboard-navigation";
import { ColumnIdentifier } from "../../../correlation-chart/prepare-data.ts";

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
}

export function ColumnNavigationMap(
  props: ColumnNavigationMapProps & NavigationProviderProps,
) {
  const {
    padding = 50,
    children,
    columnColor,
    showTriangulation,
    triangulationColor,
    keyboardNavigation = true,
    columns,
    columnIDs,
    onSelectColumn,
    onHoverColumn,
    selectedColumn,
    hoveredColumn,
    projectID,
    inProcess,
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
      h(ColumnsNavigationLayer, {
        color: columnColor,
        columns,
        columnIDs,
        onSelectColumn,
        onHoverColumn,
        selectedColumn,
        hoveredColumn,
        projectID,
        inProcess,
        keyboardNavigation,
        showTriangulation,
        triangulationColor,
      }),
      children,
    ],
  );
}

interface ColumnLayerProps {
  enabled?: boolean;
  color?: string;
}

interface ColumnKeyboardNavigationProps {
  triangulationColor?: string;
  keyboardNavigation?: boolean;
  showTriangulation?: boolean;
}

export function ColumnsNavigationLayer(
  props: NavigationProviderProps &
    ColumnLayerProps &
    ColumnKeyboardNavigationProps,
) {
  const {
    enabled,
    color,
    keyboardNavigation,
    showTriangulation,
    triangulationColor,
    ...providerProps
  } = props;

  return h(ColumnNavigationProvider, providerProps, [
    h(_ColumnsNavigationLayer, { enabled, color }),
    h.if(keyboardNavigation)(ColumnKeyboardNavigation, {
      showTriangulation,
      triangulationColor,
    }),
  ]);
}

const columnLayers = ["columns-points", "columns-fill"];

function _ColumnsNavigationLayer({ enabled = true, color }) {
  const columns = useColumnNavigationStore((state) => state.columns);
  const selectedColumn = useColumnNavigationStore(
    (state) => state.selectedColumn,
  );
  const selectColumn = useColumnNavigationStore((state) => state.selectColumn);
  const setHoveredColumn = useColumnNavigationStore(
    (state) => state.setHoveredColumn,
  );

  const onHover = useCallback(
    (event) => setHoveredColumn(event.features?.[0]?.id),
    [setHoveredColumn],
  );

  return h([
    h(BaseColumnsLayer, { enabled, color, columns }),
    h(ColumnSelectionManager, {
      selectedColumn,
      onSelectColumn: selectColumn,
      columns,
    }),
    h(ColumnHoverInteraction, { onHover }),
  ]);
}

export function ColumnSelectionManager({
  selectedColumn,
  onSelectColumn,
  centerOnSelect = true,
  columns,
}) {
  const onClick = useCallback(
    (event) => {
      if (event.features.length == 0) return;
      const selectedColumn = event.features[0];
      const id = selectedColumn.id;
      onSelectColumn(id);
    },
    [onSelectColumn],
  );

  return h([
    h.if(centerOnSelect && columns != null)(SelectedColumnCenterer, {
      selectedColumn,
      columns,
    }),
    h(SelectedColumnFeatureState, { selectedColumn }),
    h(ClickInteraction, {
      onClick,
      layers: columnLayers,
    }),
  ]);
}

export function ColumnHoverInteraction({ onHover }) {
  return h(HoverInteraction, { onHover, layers: columnLayers });
}

function ClickInteraction({ onClick, layers }) {
  useMapStyleOperator(
    (map) => {
      // Setup hover styles on map
      map.on("click", layers, onClick);
      return () => {
        map.off("click", layers, onClick);
      };
    },
    [layers, onClick],
  );
  return null;
}

function HoverInteraction({ onHover, layers }) {
  const hoveredFeaturesRef = useRef([]);
  const updateFeatureState = useCallback((map, features) => {
    // Reset hover state for previously hovered features
    for (const f of hoveredFeaturesRef.current) {
      map.setFeatureState(
        { source: f.source, id: f.id, sourceLayer: f.sourceLayer },
        { hover: false },
      );
    }
    // Set hover state for new features
    for (const f of features) {
      map.setFeatureState(
        { source: f.source, id: f.id, sourceLayer: f.sourceLayer },
        { hover: true },
      );
    }
    hoveredFeaturesRef.current = features;
  }, []);

  useMapStyleOperator(
    (map) => {
      const mouseMove = (event) => {
        if (event.features.length == 0) return;
        onHover?.(event);
        updateFeatureState(map, event.features);
        map.getCanvas().style.cursor = "pointer";
      };
      const mouseLeave = (event) => {
        onHover?.(event);
        updateFeatureState(map, event.features ?? []);
        map.getCanvas().style.cursor = "";
      };

      // Setup hover styles on map
      map.on("mousemove", layers, mouseMove);
      map.on("mouseleave", layers, mouseLeave);

      return () => {
        map.off("mouseenter", layers, mouseMove);
        map.off("mouseleave", layers, mouseLeave);
      };
    },
    [layers, onHover],
  );
  return null;
}

function SelectedColumnCenterer({
  columns,
  selectedColumn,
  easeDuration = 500,
}) {
  const columnCenter = useMemo(() => {
    if (columns == null || selectedColumn == null) return null;
    const columnGeometry = columns.find(
      (d) => d.id == selectedColumn,
    )?.geometry;
    if (columnGeometry == null) return null;
    return geoCentroid(columnGeometry);
  }, [selectedColumn, columns]);

  const mapRef = useMapRef();
  const map = mapRef.current;
  const initialRenderRef = useRef(true);
  // Center the map on the selected column when it changes
  useEffect(() => {
    if (map == null || columnCenter == null) return;
    const isInitialRender = initialRenderRef.current;
    if (isInitialRender) {
      map.setCenter(columnCenter);
      initialRenderRef.current = false;
    } else {
      map.easeTo({ center: columnCenter }, { duration: easeDuration });
    }
  }, [mapRef.current, columnCenter]);

  return null;
}

function SelectedColumnFeatureState({
  selectedColumn,
}: {
  selectedColumn: number | { id: number } | null;
}) {
  const selectedColumnRef = useRef(null);
  const selectedColumnID =
    typeof selectedColumn === "number" ? selectedColumn : selectedColumn?.id;

  useMapStyleOperator(
    (map) => {
      const prevSelectedColumn = selectedColumnRef.current;
      if (selectedColumnID == prevSelectedColumn) return;
      if (prevSelectedColumn != null) {
        // Deselect previous column
        map.setFeatureState(
          { source: "columns", id: prevSelectedColumn },
          { selected: false },
        );
      }

      selectedColumnRef.current = selectedColumnID;

      // Select the current column
      map.setFeatureState(
        { source: "columns", id: selectedColumnID },
        { selected: true },
      );
    },
    [selectedColumnID],
  );
  return null;
}
