import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";

const MacrostratUnitsContext = createContext(null);

export function MacrostratUnitsProvider({ children, units, sectionGroups }) {
  return h(
    MacrostratUnitsContext.Provider,
    { value: { units, sectionGroups } },
    children
  );
}

export function useMacrostratUnits() {
  return useContext(MacrostratUnitsContext).units;
}
