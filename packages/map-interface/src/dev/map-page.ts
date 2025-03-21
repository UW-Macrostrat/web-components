// Import other components
import { Switch } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { Spacer, useDarkMode, useStoredState } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useState, useEffect } from "react";
import { buildInspectorStyle } from "./xray";
import { MapAreaContainer, PanelCard } from "../container";
import { FloatingNavbar, MapLoadingButton } from "../context-panel";
import { MapMarker, useBasicMapStyle } from "../helpers";
import { LocationPanel } from "../location-panel";
import { MapView } from "../map-view";
import styles from "./main.module.sass";
import { TileExtentLayer } from "./tile-extent";
import {
  FeaturePanel,
  FeatureSelectionHandler,
  TileInfo,
} from "./vector-tile-features";
import { MapPosition } from "@macrostrat/mapbox-utils";

export const h = hyper.styled(styles);

export function MapInspectorV2({
  title = "Map inspector",
  headerElement = null,
  transformRequest = null,
  mapPosition = null,
  mapboxToken = null,
  overlayStyle = null,
  controls = null,
  children = null,
  style,
  bounds = null,
  focusedSource = null,
  focusedSourceTitle = null,
  fitViewport = true,
  styleType = "macrostrat",
}: {
  headerElement?: React.ReactNode;
  transformRequest?: mapboxgl.TransformRequestFunction;
  title?: string;
  style?: mapboxgl.Style | string;
  controls?: React.ReactNode;
  children?: React.ReactNode;
  mapboxToken?: string;
  overlayStyle?: mapboxgl.Style | string;
  focusedSource?: string;
  focusedSourceTitle?: string;
  projection?: string;
  mapPosition?: MapPosition;
  bounds?: [number, number, number, number];
  fitViewport?: boolean;
  styleType?: "standard" | "macrostrat";
}) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */

  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  if (mapboxToken != null) {
    mapboxgl.accessToken = mapboxToken;
  }

  style ??= useBasicMapStyle({ styleType });

  const [isOpen, setOpen] = useState(false);

  const [state, setState] = useStoredState("macrostrat:dev-map-page", {
    showTileExtent: false,
    xRay: false,
  });
  const { showTileExtent, xRay } = state;

  const [actualStyle, setActualStyle] = useState(null);

  useEffect(() => {
    buildInspectorStyle(style, overlayStyle, {
      mapboxToken,
      inDarkMode: isEnabled,
      xRay,
    }).then(setActualStyle);
  }, [style, xRay, mapboxToken, isEnabled, overlayStyle]);

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const [data, setData] = useState(null);

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
        h(FeaturePanel, { features: data, focusedSource, focusedSourceTitle }),
      ]
    );
  }

  let tile = null;
  if (showTileExtent && data?.[0] != null) {
    let f = data[0];
    tile = { x: f._x, y: f._y, z: f._z };
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, {
        rightElement: h(MapLoadingButton, {
          large: true,
          active: isOpen,
          onClick: () => setOpen(!isOpen),
          style: {
            marginRight: "-5px",
          },
        }),
        headerElement,
        title,
      }),
      contextPanel: h(PanelCard, [
        controls,
        h(Switch, {
          checked: xRay,
          label: "X-ray mode",
          onChange() {
            setState({ ...state, xRay: !xRay });
          },
        }),
      ]),
      detailPanel: detailElement,
      contextPanelOpen: isOpen,
      fitViewport,
    },
    h(
      MapView,
      {
        style: actualStyle,
        transformRequest,
        mapPosition,
        projection: { name: "globe" },
        mapboxToken,
        bounds,
      },
      [
        h(FeatureSelectionHandler, {
          selectedLocation: inspectPosition,
          setFeatures: setData,
        }),
        h(MapMarker, {
          position: inspectPosition,
          setPosition: onSelectPosition,
        }),
        h(TileExtentLayer, { tile, color: isEnabled ? "white" : "black" }),
        children,
      ]
    )
  );
}

function MapInspector(props) {
  const { children, controls, ...rest } = props;
  /** Compatibility wrapper for MapInspectorV2 */
  // React warning about this legacy usage
  console.warn("MapInspector is deprecated. Use MapInspectorV2 instead");

  return h(MapInspectorV2, {
    ...rest,
    controls: [children, controls],
  });
}

// Legacy export
export const DevMapPage = MapInspector;
