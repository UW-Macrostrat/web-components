import ReactDataSheet, { DataEditor } from "react-datasheet/lib";
import { useDataSheet } from "./provider";
import { hyperStyled } from "@macrostrat/hyper";
import { useRef, useEffect } from "react";
import { useScrollOffset } from "@macrostrat/ui-components";
import styles from "./module.styl";
import { Row, Sheet } from "./components";

const h = hyperStyled(styles);

function VirtualizedDataEditor({ row, ...rest }) {
  const { rowOffset } = useDataSheet();
  return h(DataEditor, {
    row: row + rowOffset,
    ...rest,
  });
}

type OptionalSelection = ReactDataSheet.Selection | null;

function offsetSelection(
  sel: OptionalSelection,
  offset: number
): OptionalSelection {
  if (sel == null) return null;
  const { start, end } = sel;
  return {
    start: { i: start.i + offset, j: start.j },
    end: { i: end.i + offset, j: end.j },
  };
}

const defaultSize = { height: 20, width: 100 };

function VirtualizedSheet(props) {
  const {
    data,
    dataEditor,
    onCellsChanged,
    scrollBuffer = 50,
    style = {},
    height,
    width,
    ...rest
  } = props;

  const { rowHeight, selection, dispatch } = useDataSheet();

  const ref = useRef<HTMLDivElement>();

  //const elementSize = useElementSize(ref) ?? {};
  const scrollOffset = useScrollOffset(ref);

  const scrollerHeight = data.length * rowHeight;
  const percentage = scrollOffset / scrollerHeight;
  const rowsToDisplay = Math.ceil((height + scrollBuffer) / rowHeight);
  const rowOffset = Math.floor(percentage * (data.length - rowsToDisplay + 5));

  useEffect(() => {
    dispatch({ type: "set-row-offset", value: rowOffset });
  }, [rowOffset]);

  const lastRow = Math.min(rowOffset + rowsToDisplay, data.length - 1);

  return h("div.virtualized-sheet", { ref, style: { height, width } }, [
    h("div.ui", { style: { height, width } }, [
      h(ReactDataSheet, {
        ...rest,
        width,
        height,
        sheetRenderer: Sheet,
        data: data.slice(rowOffset, lastRow),
        selected: offsetSelection(selection, -rowOffset),
        onSelect(sel) {
          dispatch({ type: "set-selection", value: sel });
        },
        rowRenderer: Row,
        dataEditor: VirtualizedDataEditor,
        onCellsChanged(changes) {
          changes.forEach((d) => (d.row += rowOffset));
          onCellsChanged?.(changes);
        },
      }),
    ]),
    h("div.scroll-panel", {
      style: { height: scrollerHeight },
    }),
  ]);
}

export { VirtualizedSheet, VirtualizedDataEditor, offsetSelection };
