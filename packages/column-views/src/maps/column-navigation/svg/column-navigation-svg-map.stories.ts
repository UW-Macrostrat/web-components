import h from "@macrostrat/hyper";

import { Meta } from "@storybook/react";
import { ColumnNavigationSVGMap, ColumnNavigationSVGMapProps } from ".";
import { MacrostratAPIProvider } from "../../../providers";
import { useState } from "react";

interface ColumnIndexMapProps extends ColumnNavigationSVGMapProps {
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
  title: "Column views/Maps/Column navigation (SVG)",
  component: BasicColumnNavigatorMap,
} as Meta<typeof ColumnNavigatorMap>;

export const StaticColumnView = {
  args: {
    center: [-100, 38],
  },
};

export function Interactive() {
  const [currentColumn, setCurrentColumn] = useState(null);
  return h(BasicColumnNavigatorMap, {
    currentColumn,
    setCurrentColumn,
  });
}

export function ShowingTriangulation() {
  const [currentColumn, setCurrentColumn] = useState(null);
  return h(BasicColumnNavigatorMap, {
    currentColumn,
    setCurrentColumn,
    showDebugLayers: true,
  });
}
