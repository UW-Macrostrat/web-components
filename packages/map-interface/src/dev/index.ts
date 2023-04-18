// Import other components
import hyper from "@macrostrat/hyper";
import { useMapRef } from "@macrostrat/mapbox-react";

import { setMapPosition } from "@macrostrat/mapbox-utils";
import { JSONView, useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState, useMemo } from "react";
import { LoaderButton } from "~/map-interface/components/navbar";
import { LocationPanel } from "@macrostrat/map-interface";
import { FloatingNavbar } from "~/map-interface/components/navbar";
import { MapAreaContainer } from "~/map-interface/map-page";
import { PanelCard } from "~/map-interface/map-page/menu";
import { CoreMapView, MapMarker } from "~/map-interface/map-page/map-view";
import {
  FeaturePanel,
  FeatureSelectionHandler,
  TileInfo,
} from "./vector-tile-features";
import { TileExtentLayer } from "./tile-extent";
import { MapPosition } from "@macrostrat/mapbox-utils";
import styles from "../main.module.styl";
import { ParentRouteButton } from "./utils";

export enum MacrostratVectorTileset {
  Carto = "carto",
  CartoSlim = "carto-slim",
  IGCPOrogens = "igcp-orogens",
}

export enum MacrostratRasterTileset {
  Carto = "carto",
  Emphasized = "emphasized",
}

export const h = hyper.styled(styles);

function initializeMap(args = {}) {
  const map = new mapboxgl.Map({
    container: "map",
    maxZoom: 18,
    //maxTileCacheSize: 0,
    logoPosition: "bottom-left",
    trackResize: true,
    antialias: true,
    optimizeForTerrain: true,
    ...args,
  });

  //setMapPosition(map, mapPosition);
  return map;
}

interface DevMapViewProps {
  style: mapboxgl.Style;
  children: React.ReactNode;
  transformRequest?: mapboxgl.TransformRequestFunction;
  mapPosition?: MapPosition;
  accessToken?: string;
}

export function DevMapView(props: DevMapViewProps): React.ReactElement {
  const { style, transformRequest, children, accessToken, mapPosition } = props;

  if (accessToken != null) {
    mapboxgl.accessToken = accessToken;
  }

  let mapRef = useMapRef();

  //const baseMapURL = getBaseMapStyle(new Set([]), isDarkMode);

  /* HACK: Right now we need this to force a render when the map
    is done loading
    */
  const [mapInitialized, setMapInitialized] = useState(0);

  // Map initialization
  useEffect(() => {
    if (style == null) return;
    mapRef.current = initializeMap({ style, transformRequest });
    setMapInitialized(mapInitialized + 1);
  }, [style, transformRequest]);

  // Map style updating
  useEffect(() => {
    if (mapRef?.current == null || style == null) return;
    mapRef?.current?.setStyle(style);
  }, [mapRef.current, style]);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    setMapPosition(map, mapPosition);
  }, [mapRef.current, mapInitialized]);

  // This seems to do a bit of a poor job at the moment. Maybe because fo caching?

  return h(CoreMapView, null, [children]);
}

export function DevMapPage({
  title = null,
  headerElement = null,
  transformRequest = null,
  children,
  style,
}: {
  headerElement?: React.ReactElement;
  transformRequest?: mapboxgl.TransformRequestFunction;
  title?: string;
  style: mapboxgl.Style;
  children?: React.ReactNode;
}) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */

  const [isOpen, setOpen] = useState(false);

  const [state, setState] = useState({ showTileExtent: false });
  const { showTileExtent } = state;

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const [data, setData] = useState(null);
  const isLoading = false; //useAppState((state) => state.core.mapIsLoading);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
  }, []);

  let detailElement = null;
  if (inspectPosition != null) {
    detailElement = h(
      LocationPanel,
      {
        onClose() {
          setInspectPosition(null);
        },
        position: inspectPosition,
      },
      [
        h(TileInfo, {
          feature: data?.[0] ?? null,
          showExtent: showTileExtent,
          setShowExtent() {
            setState({ ...state, showTileExtent: !showTileExtent });
          },
        }),
        h(FeaturePanel, { features: data }),
      ]
    );
  }

  const { isEnabled } = useDarkMode();

  let tile = null;
  if (showTileExtent && data?.[0] != null) {
    let f = data[0];
    tile = { x: f._x, y: f._y, z: f._z };
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, { className: "searchbar" }, [
        h([h(ParentRouteButton), headerElement ?? h("h2", title)]),
        h("div.spacer"),
        h(LoaderButton, {
          active: isOpen,
          onClick: () => setOpen(!isOpen),
          isLoading,
        }),
      ]),
      contextPanel: h(PanelCard, [children]),
      detailPanel: detailElement,
      contextPanelOpen: isOpen,
    },
    h(DevMapView, { style, transformRequest }, [
      h(FeatureSelectionHandler, {
        selectedLocation: inspectPosition,
        setFeatures: setData,
      }),
      h(MapMarker, {
        position: inspectPosition,
        setPosition: onSelectPosition,
      }),
      h(TileExtentLayer, { tile, color: isEnabled ? "white" : "black" }),
    ])
  );
}
