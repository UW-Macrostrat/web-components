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
import { useMapElement, useMapRef } from "@macrostrat/mapbox-react";

function MapControlWrapper({ className, control, ...controlOptions }) {
  /** A wrapper for using Mapbox GL controls with a Mapbox GL map */
  const map = useMapRef();
  const controlContainer = useRef<HTMLDivElement>();
  const controlRef = useRef<Base>();

  useEffect(() => {
    if (map.current == null) return;
    const ctrl = new control(controlOptions);
    controlRef.current = ctrl;
    console.log(map.current);
    const controlElement = ctrl.onAdd(map.current);
    controlContainer.current.appendChild(controlElement);
    return () => {
      controlRef.current?.onRemove();
    };
  }, [map, controlRef, controlContainer, controlOptions]);

  return h("div.map-control-wrapper", { className, ref: controlContainer });
}

function createControlComponent(control, _className) {
  return ({ className, ...controlOptions }) =>
    h(MapControlWrapper, {
      className: classNames(_className, className),
      control,
      controlOptions,
    });
}

function GlobeControl({ className }) {
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

const CompassControl = createControlComponent(
  _CompassControl,
  "compass-control"
);
const ZoomControl = createControlComponent(_ZoomControl, "zoom-control");
const ThreeDControl = createControlComponent(_ThreeDControl, "map-3d-control");

export {
  ThreeDControl,
  CompassControl,
  GlobeControl,
  MapControlWrapper,
  ZoomControl,
};
