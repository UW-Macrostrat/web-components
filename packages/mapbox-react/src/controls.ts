import h from "@macrostrat/hyper";
import Base from "mapbox-gl-controls/lib/Base/Base";
import Button from "mapbox-gl-controls/lib/Button/Button";
import {
  CompassControl as _CompassControl,
  ZoomControl as _ZoomControl,
} from "mapbox-gl-controls";
import { Icon } from "@blueprintjs/core";
import { useRef, useEffect, useState } from "react";
import classNames from "classnames";
import { useMapElement, useMapRef } from "./context";

export function MapControlWrapper({ className, control, options = {} }) {
  /** A wrapper for using Mapbox GL controls with a Mapbox GL map */
  const mapRef = useMapRef();
  const controlContainer = useRef<HTMLDivElement>();
  const controlRef = useRef<Base>();

  // Memoize the options object so that we don't continually recreate the control.
  const _options = useRef(options);
  useEffect(() => {
    _options.current = options;
  }, Object.values(options));

  useEffect(() => {
    if (mapRef.current == null) return;
    const ctrl = new control(_options);

    controlRef.current = ctrl;
    const controlElement = ctrl.onAdd(mapRef.current);
    controlContainer.current.appendChild(controlElement);
    return () => {
      controlRef.current?.onRemove();
    };
  }, [mapRef.current, controlContainer.current, control, _options]);

  return h("div.map-control-wrapper", { className, ref: controlContainer });
}

export function GlobeControl({ className }) {
  const map = useMapElement();

  const [mapIsGlobe, setIsGlobe] = useState(false);
  useEffect(() => {
    // @ts-ignore
    let proj = map?.getProjection().name;
    setIsGlobe(proj == "globe");
  }, [map]);
  const nextProj = mapIsGlobe ? "mercator" : "globe";
  const icon = mapIsGlobe ? "map" : "globe";

  return h(
    "div.map-control.globe-control.mapboxgl-ctrl-group.mapboxgl-ctrl.mapbox-control",
    { className },
    [
      h(
        "button.globe-control-button",
        {
          onClick() {
            if (map == null) return;
            // @ts-ignore
            map.setProjection(nextProj);
            setIsGlobe(nextProj == "globe");
          },
        },
        h(Icon, { icon })
      ),
    ]
  );
}

// Control for managing map 3D settings

class _ThreeDControl extends Base {
  /** A Mapbox GL control for entering 3D mode. */
  button: Button;

  constructor() {
    super();
    this.button = new Button();
  }

  insert() {
    this.addClassName("mapbox-3d");
    this.button.setText("3D");
    this.button.onClick(() => {
      this.map.easeTo({ pitch: 60, duration: 1000 });
    });
    this.addButton(this.button);
  }

  onAddControl() {
    this.insert();
  }
}

export function CompassControl({ className, options }) {
  return h(MapControlWrapper, {
    className: classNames("compass-control", className),
    control: _CompassControl,
    options,
  });
}

export const ZoomControl = ({ className, options }) =>
  h(MapControlWrapper, {
    className: classNames("zoom-control", className),
    control: _ZoomControl,
    options,
  });

export const ThreeDControl = ({ className, options }) =>
  h(MapControlWrapper, {
    className: classNames("map-3d-control", className),
    control: _ThreeDControl,
    options,
  });
