import { createContext, useContext, ReactNode } from "react";
import h from "@macrostrat/hyper";
import {
  createCompositeScale,
  SectionInfoExt,
} from "./prepare-units/composite-scale";
import { ExtUnit } from "./prepare-units/helpers";

const MacrostratUnitsContext = createContext(null);

interface MacrostratColumnContext {
  units: ExtUnit[];
  sections: SectionInfoExt[];
  totalHeight?: number;
}

export function MacrostratUnitsProvider({
  children,
  units,
  sections,
  totalHeight,
}: MacrostratColumnContext & { children: ReactNode }) {
  /** Provider for Macrostrat column data */
  return h(
    MacrostratUnitsContext.Provider,
    { value: { units, sections, totalHeight } },
    children
  );
}

export function useMacrostratUnits() {
  return useContext(MacrostratUnitsContext)?.units;
}

export function useCompositeScale() {
  const ctx = useContext(MacrostratUnitsContext);
  if (!ctx) {
    throw new Error(
      "useCompositeScale must be used within a MacrostratUnitsProvider"
    );
  }
  return createCompositeScale(ctx.sections, true);
}
