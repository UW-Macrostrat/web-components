import hyper from "@macrostrat/hyper";
import { useMapConditionalStyle, useMapRef } from "@macrostrat/mapbox-react";
import { mapViewInfo } from "@macrostrat/mapbox-utils";
import classNames from "classnames";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef } from "react";
import {
  MapLayer,
  useAppActions,
  useAppState,
} from "~/map-interface/app-state";
import styles from "./main.module.sass";
import { toggleLineSymbols } from "../map-style";
import { enable3DTerrain } from "./terrain";
import {
  MapLoadingReporter,
  MapMovedReporter,
  MapPaddingManager,
  MapResizeManager,
} from "../helpers";

const h = hyper.styled(styles);

interface MapViewProps {
  showLineSymbols?: boolean;
  children?: React.ReactNode;
  accessToken?: string;
}

export function MapView(props: MapViewProps) {
  const { mapLayers, mapPosition, mapSettings } = useAppState(
    (state) => state.core
  );
  const runAction = useAppActions();

  const infoMarkerPosition = useAppState(
    (state) => state.core.infoMarkerPosition
  );

  const { children, accessToken } = props;

  if (accessToken != null) {
    mapboxgl.accessToken = accessToken;
  }

  let mapRef = useMapRef();

  const ref = useRef<HTMLDivElement>();
  const parentRef = useRef<HTMLDivElement>();
  const { mapUse3D, mapIsRotated } = mapViewInfo(mapPosition);

  const hasLineSymbols =
    mapLayers.has(MapLayer.LINE_SYMBOLS) && mapLayers.has(MapLayer.LINES);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    // Update line symbol visibility on map load
    toggleLineSymbols(map, hasLineSymbols);
  }, [mapRef.current]);

  const demSourceID = mapSettings.highResolutionTerrain
    ? "mapbox-3d-dem"
    : null;
  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    enable3DTerrain(map, mapUse3D, demSourceID);
  }, [mapRef.current, mapUse3D]);

  useMapConditionalStyle(mapRef, hasLineSymbols, toggleLineSymbols);

  const className = classNames({
    "is-rotated": mapIsRotated ?? false,
    "is-3d-available": mapUse3D ?? false,
  });

  const onMapMoved = useCallback(
    (mapPosition) => {
      runAction({ type: "map-moved", data: { mapPosition } });
    },
    [infoMarkerPosition]
  );

  const mapIsLoading = useAppState((state) => state.core.mapIsLoading);

  return h("div.map-view-container.main-view", { ref: parentRef }, [
    h("div.mapbox-map#map", { ref, className }),
    h(MapLoadingReporter, {
      ignoredSources: ["elevationMarker", "crossSectionEndpoints"],
      mapIsLoading,
      onMapLoading() {
        runAction({ type: "map-loading" });
      },
      onMapIdle() {
        runAction({ type: "map-idle" });
      },
    }),
    h(MapMovedReporter, { infoMarkerPosition, onMapMoved }),
    h(MapResizeManager, { containerRef: ref }),
    h(MapPaddingManager, { containerRef: ref, parentRef, infoMarkerPosition }),
    children,
  ]);
}
