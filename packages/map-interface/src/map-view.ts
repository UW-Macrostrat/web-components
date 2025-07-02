import hyper from "@macrostrat/hyper";
import {
  useMapRef,
  useMapDispatch,
  use3DTerrain,
  getTerrainLayerForStyle,
  useMapStatus,
} from "@macrostrat/mapbox-react";
import React from "react";
import {
  mapViewInfo,
  MapPosition,
  setMapPosition,
  getMapPosition,
  getMapboxStyle,
  mergeStyles,
} from "@macrostrat/mapbox-utils";
import classNames from "classnames";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import styles from "./main.module.sass";
import {
  MapLoadingReporter,
  MapMovedReporter,
  MapPaddingManager,
  MapResizeManager,
} from "./helpers";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapPadding } from "./utils";
import { useAsyncEffect } from "@macrostrat/ui-components";

const h = hyper.styled(styles);

type MapboxCoreOptions = Omit<mapboxgl.MapboxOptions, "container">;

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
}

export interface MapboxOptionsExt extends MapboxCoreOptions {
  mapPosition?: MapPosition;
}

function defaultInitializeMap(container, args: MapboxOptionsExt = {}) {
  const { mapPosition, ...rest } = args;

  const map = new mapboxgl.Map({
    container,
    maxZoom: 18,
    logoPosition: "bottom-left",
    trackResize: false,
    antialias: true,
    // This is a legacy option for Mapbox GL v2
    // @ts-ignore
    optimizeForTerrain: true,
    ...rest,
  });

  let _mapPosition = mapPosition;
  if (_mapPosition == null && rest.center == null && rest.bounds == null) {
    // If no map positioning information is provided, we use the default
    _mapPosition = defaultMapPosition;
  }

  // set initial map position
  if (_mapPosition != null) {
    setMapPosition(map, _mapPosition);
  }

  return map;
}

const defaultMapPosition: MapPosition = {
  camera: {
    lat: 34,
    lng: -120,
    altitude: 300000,
  },
};

export function MapView(props: MapViewProps) {
  let { terrainSourceID } = props;
  const {
    enableTerrain = true,
    style,
    mapPosition,
    initializeMap = defaultInitializeMap,
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
    ...rest
  } = props;
  if (enableTerrain) {
    terrainSourceID ??= "mapbox-3d-dem";
  }

  const _mapboxToken = mapboxToken ?? accessToken;

  if (_mapboxToken != null) {
    mapboxgl.accessToken = _mapboxToken;
  }

  const dispatch = useMapDispatch();
  let mapRef = useMapRef();
  const ref = useRef<HTMLDivElement>();
  const parentRef = useRef<HTMLDivElement>();

  const [baseStyle, setBaseStyle] = useState<mapboxgl.Style>(null);

  const estMapPosition: MapPosition | null =
    mapRef.current == null ? mapPosition : getMapPosition(mapRef.current);
  const { mapUse3D, mapIsRotated } = mapViewInfo(estMapPosition);
  const is3DAvailable = (mapUse3D ?? false) && enableTerrain;

  useEffect(() => {
    /** Manager to update map style */
    if (baseStyle == null) return;
    let map = mapRef.current;

    let newStyle: mapboxgl.StyleSpecification = baseStyle;

    const overlayStyles = props.overlayStyles ?? [];

    if (overlayStyles.length > 0) {
      newStyle = mergeStyles(newStyle, ...overlayStyles);
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
      const map = initializeMap(ref.current, {
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
  }, [baseStyle, overlayStyles, transformStyle]);

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

  const className = classNames(
    {
      "is-rotated": mapIsRotated ?? false,
      "is-3d-available": is3DAvailable,
    },
    `${_projection}-projection`,
  );

  const parentClassName = classNames({
    standalone,
  });

  return h(
    "div.map-view-container.main-view",
    { ref: parentRef, className: parentClassName },
    [
      h("div.mapbox-map#map", { ref, className }),
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
  style,
}: {
  mapUse3D?: boolean;
  terrainSourceID?: string;
  style?: mapboxgl.StyleSpecification | string;
}) {
  use3DTerrain(mapUse3D, terrainSourceID);

  return null;
}
