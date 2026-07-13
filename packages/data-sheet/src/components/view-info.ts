import h from "../postgrest-table/main.module.sass";
import {
  ViewInfo,
  viewInfoAtom,
  tableFooterAtom,
  chunkPageAtom,
} from "../postgrest-table";
import { ctx, useItemCount } from "../provider";
import { Button, ButtonGroup, Icon, Spinner } from "@blueprintjs/core";

function VisibleRegionControl() {
  const viewInfo: ViewInfo = ctx.useValue(viewInfoAtom);

  return h("p", [
    `Rows ${viewInfo.visibleRegion.rowIndexStart}–${viewInfo.visibleRegion.rowIndexEnd}`,
    " of ",
    h("span.total-count", viewInfo.totalCount),
  ]);
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
    status = h(Icon, { icon: "tick", size: 12 });
  } else {
    status = h(Icon, { icon: "more", size: 12 });
  }

  return h("div.load-progress", [h(LoadProgressLabel), status]);
}

export function LoadProgressLabel() {
  const { loaded, total } = ctx.useValue(tableFooterAtom);
  let countText = useItemCount(total ?? loaded);
  if (total != null && loaded <= total) {
    countText = `${loaded} of ` + countText;
  }
  return h("span.load-progress-label", countText);
}

/** Prev/next pager for paged fetch mode. */
function PageControl() {
  const { page, totalPages, loading } = ctx.useValue(tableFooterAtom);
  const setPage = ctx.useSet(chunkPageAtom);
  const atEnd = totalPages != null && page >= totalPages - 1;

  return h("div.load-progress", [
    loading ? h(Spinner, { size: 12 }) : null,
    h("span.load-progress-label", [
      `Page ${page + 1}`,
      totalPages != null ? ` of ${totalPages}` : "",
    ]),
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
  ]);
}
