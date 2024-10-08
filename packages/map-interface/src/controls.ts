import { useRef } from "react";
import { GeolocateControl } from "mapbox-gl";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import {
  CompassControl,
  GlobeControl,
  ThreeDControl,
  MapControlWrapper,
  useMapStatus,
} from "@macrostrat/mapbox-react";
import { ScaleControl as BaseScaleControl } from "mapbox-gl";
import { DevToolsButtonSlot } from "@macrostrat/ui-components";

const h = hyper.styled(styles);

function ScaleControl(props) {
  const optionsRef = useRef({
    maxWidth: 200,
    unit: "metric",
  });
  return h(MapControlWrapper, {
    className: "map-scale-control",
    control: BaseScaleControl,
    options: optionsRef.current,
    ...props,
  });
}

function GeolocationControl(props) {
  const optionsRef = useRef({
    showAccuracyCircle: true,
    showUserLocation: true,
    trackUserLocation: true,
    positionOptions: {
      enableHighAccuracy: true,
    },
  });
  return h(MapControlWrapper, {
    control: GeolocateControl,
    options: optionsRef.current,
    ...props,
  });
}

export function MapBottomControls({ children }) {
  const { isInitialized } = useMapStatus();

  if (!isInitialized) {
    return null;
  }

  return h("div.map-controls", [
    h(ScaleControl),
    h(ThreeDControl, { className: "map-3d-control" }),
    h(CompassControl, { className: "compass-control" }),
    h(GlobeControl, { className: "globe-control" }),
    h(GeolocationControl, { className: "geolocation-control" }),
    // If we have global development tools enabled, show the button
    h(DevToolsButtonSlot, { className: "map-control" }),
    children,
  ]);
}
