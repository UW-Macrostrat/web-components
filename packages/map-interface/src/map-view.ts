import {
  useMapRef,
  useMapDispatch,
  use3DTerrain,
  getTerrainLayerForStyle,
  useMapStatus,
  useMapStyleFragments,
  useMapPosition,
} from "@macrostrat/mapbox-react";
import React from "react";
import {
  mapViewInfo,
  MapPosition,
  getMapboxStyle,
  mergeStyles,
} from "@macrostrat/mapbox-utils";
import classNames from "classnames";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import h from "./main.module.sass";
import {
  MapLoadingReporter,
  MapMovedReporter,
  MapPaddingManager,
  MapResizeManager,
} from "./helpers";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapPadding } from "./utils";
import { useAsyncEffect } from "@macrostrat/ui-components";
import {
  defaultInitializeMap,
  type MapboxCoreOptions,
  type MapboxOptionsExt,
} from "./initialize-map";
import { type MapPool, useMapPool } from "./map-pool";

export type { MapboxOptionsExt };

export interface MapViewProps extends MapboxCoreOptions {
  showLineSymbols?: boolean;
  children?: React.ReactNode;
  mapboxToken?: string;
  // Deprecated
  accessToken?: string;
  terrainSourceID?: string;
  enableTerrain?: boolean;
  infoMarkerPosition?: mapboxgl.LngLatLike;
  mapPosition?: MapPosition;
  initializeMap?: (
    container: HTMLElement,
    args: MapboxOptionsExt,
  ) => mapboxgl.Map;
  /** Reuse maps from this pool (see `createMapPool`). Defaults to the nearest
   * `MapPoolProvider`'s; `null` opts out. Ignored with a custom `initializeMap`. */
  pool?: MapPool | null;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  onStyleLoaded?: (map: mapboxgl.Map) => void;
  onMapMoved?: (mapPosition: MapPosition, map: mapboxgl.Map) => void;
  /** This map sets its own viewport, rather than being positioned by a parent.
   * This is a hack to ensure that the map can overflow its "safe area" when false */
  standalone?: boolean;
  /** Overlay styles to apply to the map: a list of mapbox style objects or fragments to
   * overlay on top of the main map style at runtime */
  overlayStyles?: Partial<mapboxgl.StyleSpecification>[];
  /** A function to transform the map style before it is loaded */
  transformStyle?: (
    style: mapboxgl.StyleSpecification,
  ) => mapboxgl.StyleSpecification;
  loadingIgnoredSources?: string[];
  id?: string;
  className?: string;
  height?: number | string;
  width?: number | string;
}

export function MapView(props: MapViewProps) {
  let { terrainSourceID } = props;
  const {
    height,
    width,
    enableTerrain = true,
    style = "mapbox://styles/mapbox/streets-v11",
    mapPosition,
    initializeMap,
    pool,
    children,
    mapboxToken,
    // Deprecated
    accessToken,
    infoMarkerPosition,
    transformRequest,
    projection,
    onMapLoaded = null,
    onStyleLoaded = null,
    onMapMoved = null,
    standalone = false,
    overlayStyles,
    transformStyle,
    trackResize = true,
    loadingIgnoredSources = ["elevationMarker", "crossSectionEndpoints"],
    id,
    className,
    ...rest
  } = props;

  useEffect(() => {
    if (id != null) {
      console.warn(
        "Setting a specific element ID for the map is deprecated. Please use className instead.",
      );
    }
  }, [id]);

  const _mapboxToken = mapboxToken ?? accessToken;

  if (_mapboxToken != null) {
    mapboxgl.accessToken = _mapboxToken;
  }

  const dispatch = useMapDispatch();
  let mapRef = useMapRef();
  const ref = useRef<HTMLDivElement>();
  const parentRef = useRef<HTMLDivElement>();

  const [baseStyle, setBaseStyle] = useState<mapboxgl.Style>(null);

  const activePool = useActivePool(pool, initializeMap);
  const poolRef = useRef<MapPool | null>(null);
  useReleaseToPool(poolRef);

  /** Get overlay styles from map context. These are added after the base style is loaded, and can be used
   * to add layers to the map at runtime, even after initialization. They are merged with any overlay styles
   * passed in as props.
   */
  const _ctxOverlayStyles = useMapStyleFragments() as any[];

  const resolvedMapPosition = useMapPosition();
  const estMapPosition: MapPosition | null = resolvedMapPosition ?? mapPosition;
  const { mapUse3D = false, mapIsRotated } = mapViewInfo(estMapPosition);
  const is3DAvailable = mapUse3D && enableTerrain;

  useEffect(() => {
    /** Manager to update map style */
    if (baseStyle == null) return;
    let map = mapRef.current;

    let newStyle: mapboxgl.StyleSpecification = baseStyle;

    const _overlayStyles = overlayStyles ?? [];

    if (_overlayStyles.length > 0 || _ctxOverlayStyles.length > 0) {
      newStyle = mergeStyles(newStyle, ..._overlayStyles, ..._ctxOverlayStyles);
    }

    /** If we can, we try to update the map style with terrain information
     * immediately, before the style is loaded. This allows us to avoid a
     * flash of the map without terrain.
     *
     * To do this, we need to estimate the map position before load, which
     * doesn't always work.
     */
    if (is3DAvailable) {
      // We can update the style with terrain layers immediately
      const terrainStyle = getTerrainLayerForStyle(newStyle, terrainSourceID);
      newStyle = mergeStyles(newStyle, terrainStyle);
    }

    if (transformStyle != null) {
      newStyle = transformStyle(newStyle);
    }

    if (map != null) {
      dispatch({ type: "set-style-loaded", payload: false });
      map.setStyle(newStyle);
    } else {
      let initialize = initializeMap ?? defaultInitializeMap;
      if (activePool != null) initialize = activePool.acquire;
      poolRef.current = activePool;
      const map = initialize(ref.current, {
        style: newStyle,
        projection,
        mapPosition,
        transformRequest,
        ...rest,
      });
      dispatch({ type: "set-map", payload: map });
      map.setPadding(getMapPadding(ref, parentRef), { animate: false });
      onMapLoaded?.(map);
    }
  }, [baseStyle, overlayStyles, _ctxOverlayStyles, transformStyle]);

  useAsyncEffect(async () => {
    /** Manager to update map style */
    let newStyle: mapboxgl.StyleSpecification;
    if (typeof style === "string") {
      newStyle = await getMapboxStyle(style, {
        access_token: mapboxgl.accessToken,
      });
    } else {
      newStyle = style;
    }
    setBaseStyle(newStyle);
  }, [style]);

  // Get map projection
  const _projection = mapRef.current?.getProjection()?.name ?? "mercator";

  const mapClassName = classNames(
    {
      "is-rotated": mapIsRotated ?? false,
      "is-3d-available": is3DAvailable,
    },
    `${_projection}-projection`,
  );

  const parentClassName = classNames(
    {
      standalone,
    },
    className,
  );

  const containerStyle = {
    height,
    width,
  };

  return h(
    "div.map-view-container.main-view",
    { ref: parentRef, className: parentClassName, style: containerStyle },
    [
      h("div.mapbox-map.map-view", { ref, className: mapClassName, id }),
      h(MapLoadingReporter, {
        ignoredSources: loadingIgnoredSources,
      }),
      h(StyleLoadedReporter, { onStyleLoaded }),
      h(MapMovedReporter, { onMapMoved }),
      // Subsitute for trackResize: true that allows map resizing to
      // be tied to a specific ref component
      h.if(trackResize)(MapResizeManager, { containerRef: ref }),
      h(MapPaddingManager, {
        containerRef: ref,
        parentRef,
        infoMarkerPosition,
      }),
      h(MapTerrainManager, { mapUse3D: is3DAvailable, terrainSourceID, style }),
      children,
    ],
  );
}

/** The pool this view draws from, if any: an explicit `pool` prop wins over the
 * context's, and a custom initializer can't be pooled. */
function useActivePool(
  pool: MapPool | null | undefined,
  initializeMap: MapViewProps["initializeMap"],
): MapPool | null {
  const contextPool = useMapPool();
  if (initializeMap != null) return null;
  if (pool !== undefined) return pool;
  return contextPool;
}

/** Hands a pooled map back when the view unmounts. */
function useReleaseToPool(poolRef: React.MutableRefObject<MapPool | null>) {
  const mapRef = useMapRef();
  useEffect(() => {
    return () => {
      const pool = poolRef.current;
      const map = mapRef.current;
      if (pool == null || map == null) return;
      // Deferred until the view's children have removed their listeners.
      queueMicrotask(() => {
        // Still on screen: a rehearsal unmount (StrictMode, Fast Refresh).
        if (map.getContainer().isConnected) return;
        // A provider that outlives this view must not hand the parked map on.
        if (mapRef.current === map) mapRef.current = null;
        pool.release(map);
      });
    };
  }, []);
}

function StyleLoadedReporter({ onStyleLoaded = null }) {
  /** Check back every 0.1 seconds to see if the map has loaded.
   * We do it this way because mapboxgl loading events are unreliable */
  const isStyleLoaded = useMapStatus((state) => state.isStyleLoaded);
  const mapRef = useMapRef();
  const dispatch = useMapDispatch();

  useEffect(() => {
    if (isStyleLoaded) return;
    const interval = setInterval(() => {
      const map = mapRef.current;
      if (map == null) return;
      if (map.isStyleLoaded()) {
        // Wait a tick before setting the style loaded state
        dispatch({ type: "set-style-loaded", payload: true });
        onStyleLoaded?.(map);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isStyleLoaded]);

  return null;
}

export function MapTerrainManager({
  mapUse3D,
  terrainSourceID,
}: {
  mapUse3D?: boolean;
  terrainSourceID?: string;
  style?: mapboxgl.StyleSpecification | string;
}) {
  use3DTerrain(mapUse3D, terrainSourceID);

  return null;
}
