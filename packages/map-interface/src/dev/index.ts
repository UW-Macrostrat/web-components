// Import other components
import hyper from "@macrostrat/hyper";
import { useDarkMode, Spacer } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState, useMemo } from "react";
import { FloatingNavbar, MapLoadingButton } from "../context-panel";
import { LocationPanel } from "../location-panel";
import { MapAreaContainer } from "../container";
import { Card } from "@blueprintjs/core";
import classNames from "classnames";
import { MapView } from "../map-view";
import { MapMarker } from "../helpers";

import {
  FeaturePanel,
  FeatureSelectionHandler,
  TileInfo,
} from "./vector-tile-features";
import { TileExtentLayer } from "./tile-extent";
import styles from "./main.module.sass";

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

export const PanelCard = (props) =>
  h(Card, { ...props, className: classNames("panel-card", props.className) });

interface DevMapViewProps {
  accessToken?: string;
}

export function DevMapPage({
  title = "Map inspector",
  headerElement = null,
  transformRequest = null,
  mapboxToken = null,
  children,
  style = "mapbox://styles/mapbox/light-v10",
}: {
  headerElement?: React.ReactElement;
  transformRequest?: mapboxgl.TransformRequestFunction;
  title?: string;
  style: mapboxgl.Style | string;
  children?: React.ReactNode;
  mapboxToken?: string;
}) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */

  if (mapboxToken != null) {
    mapboxgl.accessToken = mapboxToken;
  }

  const [isOpen, setOpen] = useState(false);

  const [state, setState] = useState({ showTileExtent: false });
  const { showTileExtent } = state;

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
        h(FeaturePanel, { features: data }),
      ]
    );
  }

  const isEnabled = useDarkMode()?.isEnabled;

  let tile = null;
  if (showTileExtent && data?.[0] != null) {
    let f = data[0];
    tile = { x: f._x, y: f._y, z: f._z };
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, { className: "searchbar" }, [
        headerElement ?? h("h2", title),
        h(Spacer),
        h(MapLoadingButton, {
          active: isOpen,
          onClick: () => setOpen(!isOpen),
        }),
      ]),
      contextPanel: h(PanelCard, [children]),
      detailPanel: detailElement,
      contextPanelOpen: isOpen,
    },
    h(MapView, { style, transformRequest }, [
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
