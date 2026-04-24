import h from "../postgrest-table/main.module.sass";
import { ViewInfo, viewInfoAtom } from "../postgrest-table";
import { ctx } from "../provider.ts";

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
