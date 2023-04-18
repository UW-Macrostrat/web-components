import hyper from "@macrostrat/hyper";
import { useMapRef } from "@macrostrat/mapbox-react";
import { mapViewInfo } from "@macrostrat/mapbox-utils";
import classNames from "classnames";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef } from "react";
import { useAppActions, useAppState } from "~/map-interface/app-state";
import styles from "./main.module.sass";
import { enable3DTerrain } from "./terrain";
import {
  MapLoadingReporter,
  MapMovedReporter,
  MapPaddingManager,
  MapResizeManager,
} from "../helpers";

const h = hyper.styled(styles);

export interface MapViewProps {
  showLineSymbols?: boolean;
  children?: React.ReactNode;
  accessToken?: string;
  terrainSourceID?: string;
  enableTerrain?: boolean;
}

export function MapView(props: MapViewProps) {
  let { terrainSourceID } = props;
  const { enableTerrain = true, children, accessToken } = props;
  if (enableTerrain) {
    terrainSourceID ??= "mapbox-3d-dem";
  }

  const { mapPosition } = useAppState((state) => state.core);
  const runAction = useAppActions();

  const infoMarkerPosition = useAppState(
    (state) => state.core.infoMarkerPosition
  );

  const {} = props;

  if (accessToken != null) {
    mapboxgl.accessToken = accessToken;
  }

  const ref = useRef<HTMLDivElement>();
  const parentRef = useRef<HTMLDivElement>();
  const { mapUse3D, mapIsRotated } = mapViewInfo(mapPosition);

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
    h(MapTerrainManager, { mapUse3D, terrainSourceID }),
    children,
  ]);
}

export function MapTerrainManager({
  mapUse3D,
  terrainSourceID,
}: {
  mapUse3D?: boolean;
  terrainSourceID?: string;
}) {
  const mapRef = useMapRef();

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    enable3DTerrain(map, mapUse3D, terrainSourceID);
  }, [mapRef.current, mapUse3D]);
  return null;
}
