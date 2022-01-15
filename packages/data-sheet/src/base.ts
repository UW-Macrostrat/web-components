import ReactDataSheet from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";
import h from "@macrostrat/hyper";
import { forwardRef } from "react";
import { useDataSheet } from "./provider";
import { Row, Sheet } from "./components";
import React from "react";

interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

interface SheetContainerProps<T = any>
  extends ReactDataSheet.DataSheetProps<T> {
  height?: number;
  width?: number;
  children?: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const BaseSheet = forwardRef((props: SheetContainerProps, ref) => {
  const {
    scrollable = true,
    height,
    width,
    children,
    className,
    ...rest
  } = props;

  const { dispatch } = useDataSheet();

  return h(
    "div.data-sheet-container",
    { style: { height, width }, className, ref },
    [
      h("div.ui", { style: { height, width } }, [
        h(ReactDataSheet, {
          width,
          height,
          sheetRenderer: Sheet,
          rowRenderer: Row,
          onSelect(sel) {
            dispatch({ type: "set-selection", value: sel });
          },
          ...rest,
        }),
      ]),
      children,
    ]
  );
});

export { GridElement };
