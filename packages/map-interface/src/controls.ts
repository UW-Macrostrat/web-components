import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import {
  CompassControl,
  GlobeControl,
  ThreeDControl,
  ScaleControl,
  GeolocationControl,
  useMapStatus,
} from "@macrostrat/mapbox-react";
import { DevToolsButtonSlot } from "@macrostrat/ui-components";

const h = hyper.styled(styles);

export { ScaleControl, GeolocationControl };

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
