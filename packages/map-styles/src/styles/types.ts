import type { StyleSpecification as MapboxStyleSpecification } from "mapbox-gl";
import type { StyleSpecification as MaplibreStyleSpecification } from "maplibre-gl";

export type StyleSpecification =
  | MapboxStyleSpecification
  | MaplibreStyleSpecification;

export type StyleFragment = Partial<StyleSpecification>;
