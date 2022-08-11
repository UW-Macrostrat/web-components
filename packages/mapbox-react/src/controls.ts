import h from "@macrostrat/hyper";
import Base from "mapbox-gl-controls/lib/Base/Base";
import Button from "mapbox-gl-controls/lib/Button/Button";
import { CompassControl as _CompassControl, ZoomControl as _ZoomControl } from "mapbox-gl-controls";
import { Icon } from "@blueprintjs/core";

import { useRef, useEffect } from "react";
import { useMapElement, useMapRef } from "./context";


function MapControlWrapper({ className, control, controlOptions }) {
  /** A wrapper for using Mapbox GL controls with a Mapbox GL map */
  const map = useMapRef();
  const controlContainer = useRef<HTMLDivElement>();
  const controlRef = useRef<Base>();

  useEffect(() => {
    if (map?.current == null) return;
    const ctrl = new control(controlOptions);
    controlRef.current = ctrl;
    const controlElement = ctrl.onAdd(map.current);
    controlContainer.current.appendChild(controlElement);
    return () => {
      controlRef.current?.onRemove();
    };
  }, [map?.current, controlRef, controlContainer, controlOptions]);

  return h("div.map-control-wrapper", { className, ref: controlContainer });
}

const CompassControl = () =>
    h(MapControlWrapper, {
      className: "compass-control",
      control: CompassControl,
    })

function GlobeControl() {
  const map = useMapElement();

  let mapIsGlobe = false;
  // @ts-ignore
  let proj = map?.getProjection().name;
  if (proj == "globe") {
    mapIsGlobe = true;
  }
  const nextProj = mapIsGlobe ? "mercator" : "globe";
  const icon = mapIsGlobe ? "map" : "globe";

  return h(
    "div.map-control.globe-control.mapboxgl-ctrl-group.mapboxgl-ctrl.mapbox-control",
    [
      h(
        "button.globe-control-button",
        {
          onClick() {
            if (map == null) return;
            // @ts-ignore
            map.setProjection(nextProj);
          },
        },
        h(Icon, { icon })
      ),
    ]
  );
}

const ZoomControl = () =>
  h(MapControlWrapper, { className: "zoom-control", control: _ZoomControl });

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

const ThreeDControl = () =>
  h(MapControlWrapper, {
      className: "map-3d-control",
      control: _ThreeDControl,
  })

export {
  ThreeDControl,
  CompassControl,
  GlobeControl,
  MapControlWrapper,
  ZoomControl
}