import h from "./main.module.sass";
import { DataSheet } from "../core";
import { useTestLazyLoader } from "./data-loaders";

export function TestLazyLoaderTableView<T>({ ...rest }) {
  return h("div.data-sheet-outer", [
    h(
      DataSheet,
      {
        ...rest,
        editable: false,
      },
      [
        h(TestLazyLoaderManager, {
          key: "test-lazy-loader-manager",
        }),
      ],
    ),
  ]);
}

function TestLazyLoaderManager() {
  useTestLazyLoader();
  return null;
}
