import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "./postgrest-sheet.stories.module.sass";
import { DataSheet, TestLazyLoaderTableView } from "../src";
import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@blueprintjs/core";

const endpoint = "https://dev.macrostrat.org/api/pg";

function TestLazySheet(props) {
  return h(
    "div.postgrest-sheet-container",
    h(TestLazyLoaderTableView, {
      density: "medium",
    }),
  );
}

const defaultColumnOptions = {
  overrides: {
    name: "Unit name",
    comments: "Comments",
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/Lazy loader sheet",
  component: TestLazySheet,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {
    columnOptions: defaultColumnOptions,
  },
};

export function SimpleLazyLoader() {
  /** A lazy loader that appends data on demand */
  const chunkSize = 100;
  const [data, setData] = useState([]);
  const lastDataRef = useRef(data);
  const loadMoreData = useCallback(() => {
    // Simulate an API call to fetch more data
    setData((prevData) => {
      lastDataRef.current = prevData;
      // Set empty data while loading
      const newData = Array.from({ length: chunkSize }, (_, i) => {
        return null;
      });
      return [...prevData, ...newData];
    });
    setTimeout(() => {
      setData((_) => {
        const prevData = lastDataRef.current;
        console.log(
          `Loading rows ${prevData.length + 1} to ${prevData.length + chunkSize}`,
        );
        const newData = Array.from({ length: chunkSize }, (_, i) => {
          const id = prevData.length + i + 1;
          return {
            id,
            name: `Item ${id}`,
            comments: `Comments for item ${id}`,
          };
        });
        const nextData = [...lastDataRef.current, ...newData];
        lastDataRef.current = nextData;
        return nextData;
      });
    }, 500);
  }, [setData, chunkSize]);

  useEffect(() => {
    loadMoreData();
  }, [loadMoreData]);

  if (data.length === 0) {
    return h(Spinner);
  }

  return h(
    "div.postgrest-sheet-container",
    h(DataSheet, {
      data,
      editable: true,
      enableColumnReordering: false,
      columnOptions: {},
      onVisibleCellsChange: (visibleCells) => {
        if (visibleCells["rowIndexEnd"] > data.length - 5) {
          loadMoreData();
        }
      },
    }),
  );
}
