import h from "../postgrest-table/main.module.sass";
import {
  ViewInfo,
  viewInfoAtom,
  tableFooterAtom,
  chunkPageAtom,
} from "../postgrest-table";
import { ctx } from "../provider.ts";
import { Button, ButtonGroup, Icon, Spinner } from "@blueprintjs/core";

function ViewInfoControl() {
  const viewInfo: ViewInfo = ctx.useValue(viewInfoAtom);

  return h("p", [
    `Rows ${viewInfo.visibleRegion.rowIndexStart}–${viewInfo.visibleRegion.rowIndexEnd}`,
    " of ",
    h("span.total-count", viewInfo.totalCount),
  ]);
}

export function InfoBar() {
  return h("div.info-bar", [h(ViewInfoControl)]);
}

/** A minimal bottom-of-table footer reflecting the `useChunkLoader` source. In
 * scroll mode: rows loaded, "of total" when known, and a status icon (spinner
 * loading / check complete / dots incomplete). In paged mode: prev/next page
 * controls with "Page X of Y". */
export function LoadProgressIndicator() {
  const footer = ctx.useValue(tableFooterAtom);
  if (footer.mode === "paged") return h(PageControl);

  const { loaded, total, loading } = footer;
  let status: any;
  if (loading) {
    status = h(Spinner, { size: 12 });
  } else if (total != null && loaded >= total) {
    status = h(Icon, { icon: "tick-circle", intent: "success", size: 12 });
  } else {
    status = h(Icon, { icon: "more", size: 12 });
  }

  return h("div.load-progress", [
    status,
    h("span.load-progress-label", [
      `${loaded}`,
      total != null ? ` of ${total}` : "",
      " rows",
    ]),
  ]);
}

/** Prev/next pager for paged fetch mode. */
function PageControl() {
  const { page, totalPages, loading } = ctx.useValue(tableFooterAtom);
  const setPage = ctx.useSet(chunkPageAtom);
  const atEnd = totalPages != null && page >= totalPages - 1;

  return h("div.load-progress", [
    h(ButtonGroup, { minimal: true }, [
      h(Button, {
        icon: "chevron-left",
        small: true,
        disabled: page <= 0 || loading,
        onClick: () => setPage(Math.max(0, page - 1)),
      }),
      h(Button, {
        icon: "chevron-right",
        small: true,
        disabled: atEnd || loading,
        onClick: () => setPage(page + 1),
      }),
    ]),
    loading ? h(Spinner, { size: 12 }) : null,
    h("span.load-progress-label", [
      `Page ${page + 1}`,
      totalPages != null ? ` of ${totalPages}` : "",
    ]),
  ]);
}
