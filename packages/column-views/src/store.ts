import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";

const MacrostratUnitsContext = createContext(null);

export function MacrostratUnitsProvider({ children, units }) {
  return h(MacrostratUnitsContext.Provider, { value: units }, children);
}

export function useMacrostratUnits() {
  return useContext(MacrostratUnitsContext);
}
