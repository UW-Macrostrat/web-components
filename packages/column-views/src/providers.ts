import h from "@macrostrat/hyper";
import { ColumnProvider, ColumnAxisType } from "@macrostrat/column-components";
import { APIProvider, useAPIResult } from "@macrostrat/ui-components";
import { ReactNode, useMemo } from "react";
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

const LithologiesContext = createContext<Map<number, Lithology>>(null);

export function LithologiesProvider({
  children,
  baseURL = "https://macrostrat.org/api/v2",
}) {
  console.log("base URL", baseURL);
  const lithologies = useAPIResult(baseURL + "/defs/lithologies", {
    all: true,
  });

  const lithMap = useMemo(() => {
    const data = lithologies?.success?.data;
    if (data == null) return null;
    return new Map(data.map((d) => [d.lith_id, d]));
  }, [lithologies]);
  return h(LithologiesContext.Provider, { value: lithMap }, children);
}

export function useLithologies() {
  return useContext(LithologiesContext);
}
