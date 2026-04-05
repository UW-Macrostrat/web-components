import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { DataSheet } from "../core";
import { useTestLazyLoader } from "./data-loaders";
import { Spinner } from "@blueprintjs/core";

const h = hyper.styled(styles);

export function TestLazyLoaderTableView<T>({ ...rest }) {
  const { data, onScroll } = useTestLazyLoader();

  if (data == null) {
    return h(Spinner);
  }

  return h("div.data-sheet-outer", [
    h(DataSheet, {
      ...rest,
      data,
      editable: false,
      onVisibleCellsChange: onScroll,
    }),
  ]);
}
