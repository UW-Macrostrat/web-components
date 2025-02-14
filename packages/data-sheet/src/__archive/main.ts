import { DataSheetProvider } from "./provider";
import { VirtualizedSheet } from "./virtualized";
import { BaseSheet } from "./base";
import { ErrorBoundary, useElementSize } from "@macrostrat/ui-components";
import { enhanceData } from "./enhancers";
import { GridElement } from "./base";
import h from "@macrostrat/hyper";
import { useState, useEffect, useRef } from "react";
import { SheetToolbar } from "./components";
import classNames from "classnames";
import update from "immutability-helper";

export function DataSheet(props) {
  const { data: baseData, columns, onSubmit, ...rest } = props;
  const [data, setData] = useState<any[]>(baseData);
  //const [edits, setEdits] = useState([]);
  /**
   * For edits, what I could do is create an array of indexes based on the row number.
   * And at the end I can grab the whole row and send it to the backend.
   */

  useEffect(() => {
    // Set data to start with the value of the initial data
    if (baseData == null) return;
    setData(baseData);
  }, [baseData]);

  const ref = useRef();
  const size = useElementSize(ref);

  const onCancel = () => {
    setData(baseData);
  };

  //const [columns, setDesiredWidth] = useState(columnSpec);

  //const desiredWidths =
  //  initialData != null ? calculateWidths(initialData, columns) : {};

  // Change management
  // const handleUndo = () => {
  //   setData(initialData);
  //   setEdits([]);
  // };
  // const handleSubmit = () => {
  //   //push method for sending data back to api
  //   if (data.length === 0) {
  //     return null;
  //   }
  //   setData(data);
  //   const post_data = BuildEdits();
  //   console.log(post_data);
  //   postData(post_data);
  //   setEdits([]);
  // };

  // function BuildEdits() {
  //   /** Grabs the edits from the data for POST.
  //    *
  //    * How can I group them by rows so I don't have to send a item per cell
  //    */

  //   const editsList = addNecesaryFields(edits, data);
  //   const finalEdits = combineLikeIds(editsList);
  //   return finalEdits;
  // }

  function onCellsChanged(changes) {
    /** Cell change function that uses immutability-helper */
    const spec = {};
    // const edits = []; // something like what's happening with spec
    console.log(changes);
    changes.forEach(({ cell, row, col, value }) => {
      // Get the key that should be used to assign the value
      const { key } = columns[col];
      // Substitute empty strings for nulls
      const $set = value == "" ? null : value;
      // sets edits to the state index and the column name
      //setEdits((prevEdits) => [{ row, key }, ...prevEdits]);
      spec[row] = {
        ...(spec[row] || {}),
        [key]: { $set },
      };
    });
    setData(update(data, spec));
  }

  /** Builds the properties for the cell */
  const finalizeCellProps = (
    value: any,
    row: number,
    key: string,
    col: number
  ) => {
    /** Need to turn off submit on click away event for cell */

    // Check if values is the same as the initial data key
    //console.log(arguments);

    const isChanged = value != baseData[row][key];
    const readOnly = !(columns[col].editable ?? true);
    const className = classNames(
      { edited: isChanged, "read-only": readOnly },
      "cell",
      "nowrap",
      "clip"
    );
    return {
      value,
      className,
      readOnly,
    };
  };

  /** We now build cell properties in the render function, rather than storing
      them using a precomputed useEffect hook. We decide what cells have changed using
      a direct comparison with the equivalent value of initialData. (That's the
      power of immutable data.)

      This is where the Components should be attached.
      */

  const sheetHeader = h(
    SheetToolbar,
    {
      onSubmit,
      onCancel,
      hasChanges: baseData != data,
    }
    //h("div.right-actions", null, h(SettingsPopup))
  );

  return h(DataSheetUI, {
    sheetHeader,
    columns,
    onCellsChanged,
    finalizeCellProps,
    data,
    ...rest,
  });
}

function DataSheetUI({
  columns,
  data,
  virtualized = false,
  sheetHeader = null,
  finalizeCellProps,
  ...rest
}) {
  const component = virtualized ? VirtualizedSheet : BaseSheet;
  let newData = data.map((d) => transformData(columns, d));

  if (finalizeCellProps != null) {
    newData = newData.map((obj, row) => {
      return columns.map(({ key }, col) =>
        finalizeCellProps(obj[col].value, row, key, col)
      );
    });
  }
  return h(
    ErrorBoundary,
    null,
    h(
      DataSheetProvider,
      { columns },
      h("div.data-sheet", [
        sheetHeader,
        h(component, { ...rest, data: newData }),
      ])
    )
  );
}

function transformData(columns, data: object): GridElement[] {
  const row1 = columns.map((d) => {
    return { value: data[d.key] ?? null, className: "test" };
  });
  return enhanceData(row1, columns);
}
