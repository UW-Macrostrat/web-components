import { useCallback, useEffect, useMemo } from "react";
import { buildGeoJSONSource, setGeoJSON } from "@macrostrat/mapbox-utils";
import { useMapRef, useMapStyleOperator } from "@macrostrat/mapbox-react";
import { useColumnNavigationStore } from "./state";
import {
  buildTriangulation,
  buildKeyMapping,
} from "../utils/keyboard-navigation";

interface KeyboardNavProps {
  showLayers: boolean;
}

export function ColumnKeyboardNavigation(props: KeyboardNavProps) {
  /** Keyboard navigation of columns using a Delaunay triangulation */
  const { showLayers = false } = props;
  const columns = useColumnNavigationStore((state) => state.columns);
  const col_id = useColumnNavigationStore((state) => state.selectedColumn);
  const selectColumn = useColumnNavigationStore((state) => state.selectColumn);

  const voronoi = useMemo(() => {
    if (!columns || columns.length == 0) return null;
    return buildTriangulation(columns);
  }, [columns]);

  const mapRef = useMapRef();
  const map = mapRef.current;

  const projection = useMemo(() => {
    return (d) => {
      const pt = map.project(d);
      return [pt.x, pt.y];
    };
  }, [map]);

  const keyMapping = useMemo(() => {
    if (columns == null || voronoi == null) return null;
    const currentIndex = columns.findIndex(
      (d) => d.properties.col_id == col_id
    );

    const neighbors = voronoi.tri.delaunay.neighbors[currentIndex];
    return buildKeyMapping(
      neighbors,
      voronoi.centroids,
      currentIndex,
      projection
    );
  }, [col_id, columns, voronoi]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      console.log(event, keyMapping);
      if (keyMapping == null) return;
      console.log(keyMapping, event.which);
      const nextColumnIx = keyMapping[event.which];
      if (nextColumnIx == null) return;
      event.preventDefault();
      event.stopPropagation();
      // @ts-ignore
      selectColumn(columns[nextColumnIx].id);
      return false;
    },
    [keyMapping, selectColumn]
  );

  useEffect(() => {
    if (map == null) return;
    const canvas = map.getCanvas();
    canvas.addEventListener("keydown", onKeyDown);
    return () => {
      canvas.removeEventListener("keydown", onKeyDown);
    };
  }, [map, onKeyDown]);

  useMapStyleOperator(
    (map) => {
      if (!showLayers) return;
      if (voronoi == null) return;
      const { features } = voronoi.tri.links();
      setGeoJSON(map, "links", {
        type: "FeatureCollection",
        features,
      });
    },
    [voronoi]
  );

  //if (neighbors == null) return null;
  //const neighborFeatures = neighbors.map((d) => features[d]);

  return null;
}

export const keyboardNavigationStyle = {
  sources: {
    links: buildGeoJSONSource(),
    //neighbors: buildGeoJSONSource(),
  },
  layers: [
    {
      id: "column-links",
      type: "line",
      source: "links",
      paint: {
        "line-color": "purple",
        "line-width": 1,
      },
    },
    {
      id: "column-centers",
      type: "circle",
      source: "links",
      paint: {
        "circle-radius": 2,
        "circle-color": "purple",
      },
    },
  ],
};
