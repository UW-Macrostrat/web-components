export * from "./components";
export * from "./dz-spectrum";
export * from "./field-locations";
export * from "./location-info";
export * from "./data-links";
export * from "./expansion-panel";
export * from "./xdd-articles";
export * from "./tag-editor";

/* Scoped store integration (now an independent module) */
import {
  createScopedStore,
  type AtomMap,
  type StateIsolation,
} from "@macrostrat/scoped-store";

export { createScopedStore, AtomMap, StateIsolation };
