import hyper from "@macrostrat/hyper";
import {
  useMapRef,
  useMapDispatch,
  useMapPosition,
  use3DTerrain,
  getTerrainLayerForStyle,
  useMapStatus,
} from "@macrostrat/mapbox-react";
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
    args: MapboxOptionsExt
  ) => mapboxgl.Map;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  onStyleLoaded?: (map: mapboxgl.Map) => void;
  onMapMoved?: (mapPosition: MapPosition, map: mapboxgl.Map) => void;
  /** This map sets its own viewport, rather than being positioned by a parent.
   * This is a hack to ensure that the map can overflow its "safe area" when false */
  standalone?: boolean;
  /** Overlay styles to apply to the map: a list of mapbox style objects or fragments to
   * overlay on top of the main map style at runtime */
  overlayStyles?: mapboxgl.Style[];
  /** A function to transform the map style before it is loaded */
  transformStyle?: (style: mapboxgl.Style) => mapboxgl.Style;
}

export interface MapboxOptionsExt extends MapboxCoreOptions {
  mapPosition?: MapPosition;
}

function defaultInitializeMap(container, args: MapboxOptionsExt = {}) {
  const { mapPosition, ...rest } = args;
  console.log("Initializing map (default)", args);

  const map = new mapboxgl.Map({
    container,
    maxZoom: 18,
    logoPosition: "bottom-left",
    trackResize: true,
    antialias: true,
    optimizeForTerrain: true,
    ...rest,
  });

  // set initial map position
  if (mapPosition != null) {
    setMapPosition(map, mapPosition);
  }

  //setMapPosition(map, mapPosition);
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
    mapPosition = defaultMapPosition,
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
  const isStyleLoaded = useMapStatus((state) => state.isStyleLoaded);

  useEffect(() => {
    /** Manager to update map style */
    if (baseStyle == null) return;
    let map = mapRef.current;

    /** If we can, we try to update the map style with terrain information
     * immediately, before the style is loaded. This allows us to avoid a
     * flash of the map without terrain.
     *
     * To do this, we need to estimate the map position before load, which
     * doesn't always work.
     */
    // We either get the map position directly from the map or from props
    const estMapPosition: MapPosition | null =
      map == null ? mapPosition : getMapPosition(map);
    const { mapUse3D } = mapViewInfo(estMapPosition);

    let newStyle: mapboxgl.Style = baseStyle;

    const overlayStyles = props.overlayStyles ?? [];

    if (overlayStyles.length > 0) {
      newStyle = mergeStyles(newStyle, ...overlayStyles);
    }

    if (mapUse3D) {
      // We can update the style with terrain layers immediately
      const terrainStyle = getTerrainLayerForStyle(newStyle, terrainSourceID);
      newStyle = mergeStyles(newStyle, terrainStyle);
    }

    if (transformStyle != null) {
      newStyle = transformStyle(newStyle);
    }

    if (map != null) {
      console.log("Setting style", newStyle);
      dispatch({ type: "set-style-loaded", payload: false });
      map.setStyle(newStyle);
    } else {
      console.log("Initializing map", newStyle);
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

  /** Check back every 0.1 seconds to see if the map has loaded.
   * We do it this way because mapboxgl loading events are unreliable */
  useEffect(() => {
    console.log("Responding to style loaded event", isStyleLoaded);
    if (isStyleLoaded) return;
    const interval = setInterval(() => {
      const map = mapRef.current;
      if (map == null) return;
      if (map.isStyleLoaded()) {
        console.log("Style loaded");
        // Wait a tick before setting the style loaded state
        dispatch({ type: "set-style-loaded", payload: true });
        onStyleLoaded?.(map);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isStyleLoaded]);

  useAsyncEffect(async () => {
    /** Manager to update map style */
    let newStyle: mapboxgl.Style;
    if (typeof style === "string") {
      newStyle = await getMapboxStyle(style, {
        access_token: mapboxgl.accessToken,
      });
    } else {
      newStyle = style;
    }
    setBaseStyle(newStyle);
  }, [style]);

  const _computedMapPosition = useMapPosition();
  const { mapUse3D, mapIsRotated } = mapViewInfo(_computedMapPosition);

  // Get map projection
  const _projection = mapRef.current?.getProjection()?.name ?? "mercator";

  const className = classNames(
    {
      "is-rotated": mapIsRotated ?? false,
      "is-3d-available": mapUse3D ?? false,
    },
    `${_projection}-projection`
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
        ignoredSources: ["elevationMarker", "crossSectionEndpoints"],
      }),
      h(MapMovedReporter, { onMapMoved }),
      h(MapResizeManager, { containerRef: ref }),
      h(MapPaddingManager, {
        containerRef: ref,
        parentRef,
        infoMarkerPosition,
      }),
      h(MapTerrainManager, { mapUse3D, terrainSourceID, style }),
      children,
    ]
  );
}

export function MapTerrainManager({
  mapUse3D,
  terrainSourceID,
  style,
}: {
  mapUse3D?: boolean;
  terrainSourceID?: string;
  style?: mapboxgl.Style | string;
}) {
  use3DTerrain(mapUse3D, terrainSourceID);

  return null;
}
