import hyper from "@macrostrat/hyper";
import styles from "./age-model-overlay.module.sass";
const h = hyper.styled(styles);

export function BoundaryAgeModelOverlay() {
  return h("div.boundary-age-model", [
    h("div.boundary-age-model-text", "Boundary age model"),
  ]);
}
