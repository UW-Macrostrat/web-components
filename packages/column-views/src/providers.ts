import h from "@macrostrat/hyper";
import { ColumnProvider, ColumnAxisType } from "@macrostrat/column-components";
import { APIProvider } from "@macrostrat/ui-components";
import { ReactNode } from "react";

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
