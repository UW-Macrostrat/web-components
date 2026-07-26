import h from "../../postgrest-table/main.module.sass";
import { tableFooterAtom, chunkPageAtom } from "../../postgrest-table";
import { ctx, useItemCount } from "../../provider";
import { Button, ButtonGroup, Icon, Spinner } from "@blueprintjs/core";

/** A minimal bottom-of-table footer reflecting the `useChunkLoader` source. In
 * scroll mode: rows loaded, "of total" when known, and a status icon (spinner
 * loading / check complete / dots incomplete). In paged mode: prev/next page
 * controls with "Page X of Y". */
export function LoadProgressIndicator({ iconSize: size = 12, className }) {
  const footer = ctx.useValue(tableFooterAtom);
  if (footer.mode === "paged") return h(PageControl);

  const { loaded, total, loading } = footer;
  let status: any;
  if (loading) {
    status = h(Spinner, { size });
  } else if (total != null && loaded >= total) {
    status = h(Icon, { icon: "tick", size });
  } else {
    status = h(Icon, { icon: "more", size });
  }

  return h("div.load-progress", { className }, [h(LoadProgressLabel), status]);
}

export function LoadProgressLabel() {
  const { loaded, total } = ctx.useValue(tableFooterAtom);
  const expectedCount = total ?? loaded;
  let countText = useItemCount(expectedCount);
  if (expectedCount === 0) return countText;
  if (total != null && loaded <= total) {
    countText = `${loaded} of ${countText}`;
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
