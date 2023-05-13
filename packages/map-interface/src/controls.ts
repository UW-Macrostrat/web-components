import { useRef } from "react";
import { GeolocateControl } from "mapbox-gl";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import {
  CompassControl,
  GlobeControl,
  ThreeDControl,
  MapControlWrapper,
} from "@macrostrat/mapbox-react";
import { ScaleControl as BaseScaleControl } from "mapbox-gl";

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

export function MapBottomControls() {
  return h("div.map-controls", [
    h(ScaleControl),
    h(ThreeDControl, { className: "map-3d-control" }),
    //h(CompassControl, { className: "compass-control" }),
    h(GlobeControl, { className: "globe-control" }),
    h(GeolocationControl, { className: "geolocation-control" }),
  ]);
}
