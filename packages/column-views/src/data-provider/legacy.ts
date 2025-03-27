import h from "@macrostrat/hyper";
import { ColumnProvider, ColumnAxisType } from "@macrostrat/column-components";
import { useMacrostratStore } from "./base";
import { useEffect } from "react";

export function MacrostratColumnProvider(props) {
  // A column provider specialized the Macrostrat API
  return h(ColumnProvider, { axisType: ColumnAxisType.AGE, ...props });
}

/** This is now a legacy provider */
export function LithologiesProvider({ children }) {
  useEffect(() => {
    console.warn(
      "LithologiesProvider is deprecated. Replace with MacrostratDataProvider"
    );
  }, []);
  return children;
}

export function useLithologies() {
  const getLithologies = useMacrostratStore((s) => s.getLithologies);
  const lithologies = useMacrostratStore((s) => s.lithologies);
  useEffect(() => {
    if (lithologies == null) getLithologies();
  }, [lithologies, getLithologies]);
  return lithologies;
}
