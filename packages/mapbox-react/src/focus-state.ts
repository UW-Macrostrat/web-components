/* Reporters and buttons for evaluating a feature's focus on the map. */
import { Button, Intent } from "@blueprintjs/core";
import { useMapInitialized, useMapRef } from "./context";
import classNames from "classnames";
import { useEffect, useState } from "react";
import styles from "./main.module.scss";
import styleRules from "./main.module.scss?inline";
import hyper from "@macrostrat/hyper";
import {
  getBestTargetPosition,
  getFocusState,
  isCentered,
  PositionFocusState,
} from "@macrostrat/mapbox-utils";
import type GeoJSON from "geojson";
import type { LngLatLike } from "mapbox-gl";
import { FlyToOptions } from "./easing.ts";

export { isCentered };

const h = hyper.styled(styles);

export function classNameForFocusState(
  pos: PositionFocusState | null | undefined,
): string | null {
  if (pos == null) {
    return null;
  }
  switch (pos) {
    case PositionFocusState.CENTERED:
      return "centered";
    case PositionFocusState.NEAR_CENTER:
      return "near-center";
    case PositionFocusState.OFF_CENTER:
      return "off-center";
    case PositionFocusState.NEAR_EDGE:
      return "near-edge";
    case PositionFocusState.OUT_OF_PADDING:
      return "out-of-padding";
    case PositionFocusState.OUT_OF_VIEW:
      return "out-of-view";
  }
}

export function intentForFocusState(
  pos: PositionFocusState | null | undefined,
): Intent {
  if (pos == null) return Intent.NONE;
  switch (pos) {
    case PositionFocusState.CENTERED:
    case PositionFocusState.NEAR_CENTER:
      return Intent.NONE;
    case PositionFocusState.OFF_CENTER:
    case PositionFocusState.NEAR_EDGE:
      return Intent.PRIMARY;
    case PositionFocusState.OUT_OF_PADDING:
      return Intent.SUCCESS;
    case PositionFocusState.OUT_OF_VIEW:
      return Intent.WARNING;
  }
}

export function useFocusState(position: LngLatLike | GeoJSON.Geometry) {
  const map = useMapRef();
  const [focusState, setFocusState] = useState<PositionFocusState | null>(null);
  const isInitialized = useMapInitialized();

  useEffect(() => {
    if (map.current == null || position == null) return;
    const cb = () => {
      if (map.current == null) return;
      setFocusState(getFocusState(map.current, position));
    };
    map.current?.on("move", cb);
    cb();

    return () => {
      map.current?.off("move", cb);
    };
  }, [isInitialized, position]);

  return focusState;
}

function useGlobalCSSStyles(id: string, css: string) {
  // Load CSS styles into head
  useEffect(() => {
    if (document == null) return;
    if (document.getElementById(id)) return;
    const style: HTMLStyleElement = document.createElement("style");
    style.id = id;
    style.innerHTML = styleRules;
    document.head.appendChild(style);
  }, [id, css]);
}

export function LocationFocusButton({
  location,
  bounds,
  className,
  easeDuration = 800,
  focusState: _focusState = null,
  icon = null,
  ...rest
}) {
  const map = useMapRef();

  // Load CSS styles into head
  useGlobalCSSStyles("mapbox-react-focus-button-styles", styleRules);

  const _icon = icon ?? (bounds == null ? "map-marker" : "detection");
  if (location == null && bounds != null) {
    location = {
      lat: (bounds[1] + bounds[3]) / 2,
      lng: (bounds[0] + bounds[2]) / 2,
    };
  }

  const defaultFocusState = useFocusState(location);
  const focusState = _focusState ?? defaultFocusState;
  const _isCentered = focusState != null ? isCentered(focusState) : false;

  return h(
    Button,
    {
      minimal: true,
      icon: _icon,
      onClick() {
        let opts: FlyToOptions = { duration: easeDuration };
        if (focusState == PositionFocusState.CENTERED) {
          map.current?.resetNorth();
        } else if (bounds != null) {
          map.current?.fitBounds(bounds, opts);
        } else if (location != null) {
          const { zoom, ...center } = getBestTargetPosition(location);
          if (center == null) {
            return;
          } else {
            opts = { ...opts, center };
          }
          if (zoom != null) {
            opts = { ...opts, zoom };
          }
          map.current?.flyTo(opts);
        } else {
          console.warn("No location or bounds provided");
        }
      },
      className: classNames(
        "recenter-button",
        className,
        classNameForFocusState(focusState),
        bounds == null ? "position" : "bounds",
      ),
      intent: intentForFocusState(focusState),
      ...rest,
    },
    [_isCentered ? null : h("span.recenter-label", "Recenter")],
  );
}
