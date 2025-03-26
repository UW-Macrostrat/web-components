import h from "@macrostrat/hyper";
import { ColumnProvider, ColumnAxisType } from "@macrostrat/column-components";
import { APIProvider, useAPIResult } from "@macrostrat/ui-components";
import { ReactNode, useEffect, useMemo } from "react";
import type { Lithology } from "@macrostrat/api-types";

export function MacrostratColumnProvider(props) {
  // A column provider specialized the Macrostrat API
  return h(ColumnProvider, { axisType: ColumnAxisType.AGE, ...props });
}

type APIProviderProps = {
  children: ReactNode;
  useDev?: boolean;
  baseURL?: string;
};

export function MacrostratAPIProvider({
  children,
  useDev = false,
  baseURL,
}: APIProviderProps) {
  baseURL ??= useDev
    ? "https://dev2.macrostrat.org/api/v2"
    : "https://macrostrat.org/api/v2";

  return h(
    APIProvider,
    {
      baseURL,
      unwrapResponse: (res) => res.success.data,
    },
    children
  );
}

import { createContext, useContext } from "react";
import { useMacrostratStore } from "./data-provider";

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
