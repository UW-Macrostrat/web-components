import h from "../../postgrest-table/main.module.sass";
import { Button, NonIdealState } from "@blueprintjs/core";
import { useLoadControls } from "../../postgrest-table";
import { ctx, dataRefreshTokenAtom } from "../../provider";

/** A failed load, with a retry: loading stays off after an error, so
 * reloading is the user's call. */
export function LoadErrorState({ error }: { error: Error }) {
  const bumpRefresh = ctx.useSet(dataRefreshTokenAtom);
  return h(NonIdealState, {
    icon: "error",
    title: "Couldn't load data",
    description: error.message ?? "The data source returned an error.",
    action: h(
      Button,
      { icon: "refresh", onClick: () => bumpRefresh((v) => v + 1) },
      "Try again",
    ),
  });
}

/** `LoadErrorState` over a table body that has no rows to show. Once rows are
 * loaded, a later failure is reported by the footer instead. */
export function LoadErrorOverlay() {
  const { error, loaded } = useLoadControls();
  if (error == null || loaded > 0) return null;
  return h("div.load-error-overlay", h(LoadErrorState, { error }));
}
