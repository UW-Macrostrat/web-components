import h from "@macrostrat/hyper";
import { APIProvider } from "@macrostrat/ui-components";

export function MacrostratAPIProvider({ children }) {
  return h(
    APIProvider,
    {
      baseURL: "https://dev.macrostrat.org/api/v2",
      unwrapResponse: res => res.success.data
    },
    children
  );
}
