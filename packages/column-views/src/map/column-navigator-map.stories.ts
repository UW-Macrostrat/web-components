import h from "@macrostrat/hyper";

import { Meta } from "@storybook/react";
import { ColumnNavigatorMap, ColumnNavigatorProps } from ".";
import { MacrostratAPIProvider } from "../providers";
import { useState } from "react";

interface ColumnIndexMapProps extends ColumnNavigatorProps {
  col_id: number;
}

function BasicColumnNavigatorMap(props: ColumnIndexMapProps) {
  return h(
    MacrostratAPIProvider,
    { baseURL: "https://macrostrat.org/api/v2" },
    h(ColumnNavigatorMap, { style: { width: 500, height: 500 }, ...props })
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Column navigator map",
  component: BasicColumnNavigatorMap,
} as Meta<typeof ColumnNavigatorMap>;

export const Default = {
  args: {
    center: [-100, 38],
  },
};

export function WithSelectedColumn() {
  const [currentColumn, setCurrentColumn] = useState(null);
  return h(BasicColumnNavigatorMap, {
    currentColumn,
    setCurrentColumn,
  });
}

export function ShowTriangulation() {
  const [currentColumn, setCurrentColumn] = useState(null);
  return h(BasicColumnNavigatorMap, {
    currentColumn,
    setCurrentColumn,
    showDebugLayers: true,
  });
}
