import h from "@macrostrat/hyper";
import { fmt3, normalizeLng } from "./utils";

export function ValueWithUnit(props) {
  const { value, unit } = props;
  return h("span.value-with-unit", [
    h("span.value", [value]),
    h("span.spacer", [" "]),
    h("span.unit", [unit]),
  ]);
}

export function DegreeCoord(props) {
  const { value, labels } = props;
  const direction = value < 0 ? labels[1] : labels[0];
  return h(ValueWithUnit, {
    value: Math.abs(value) + "°",
    unit: direction,
  });
}

export function LngLatCoords(props) {
  const { position, className } = props;
  if (position == null) {
    return null;
  }
  let lat, lng;
  if (Array.isArray(position)) {
    [lng, lat] = position;
  } else {
    ({ lat, lng } = position);
  }

  return h("div.lnglat-container", { className }, [
    h("span.lnglat", [
      h(DegreeCoord, {
        value: fmt3(lat),
        labels: ["N", "S"],
      }),
      ", ",
      h(DegreeCoord, {
        value: fmt3(normalizeLng(Number(lng))),
        labels: ["E", "W"],
      }),
    ]),
  ]);
}
