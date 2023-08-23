import h from "@macrostrat/hyper";
import { APIProvider } from "@macrostrat/ui-components";
import React from "react";

type _ = { children: React.ReactNode; useDev?: boolean; baseURL?: string };
export function MacrostratAPIProvider({ children, useDev = true, baseURL }: _) {
  baseURL ??= useDev
    ? "https://dev.macrostrat.org/api/v2"
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
