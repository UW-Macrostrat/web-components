import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";

const MacrostratUnitsContext = createContext(null);

interface MacrostratColumnContext {
  units: any[];
  sectionGroups: any[];
  columnID?: number;
}

export function MacrostratUnitsProvider({
  children,
  units,
  sectionGroups,
}: MacrostratColumnContext) {
  /** Provider for Macrostrat column data */
  return h(
    MacrostratUnitsContext.Provider,
    { value: { units, sectionGroups } },
    children
  );
}

export function useMacrostratUnits() {
  return useContext(MacrostratUnitsContext)?.units;
}
