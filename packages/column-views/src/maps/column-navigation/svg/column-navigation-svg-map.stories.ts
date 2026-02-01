import h from "@macrostrat/hyper";

import { Meta } from "@storybook/react-vite";
import { ColumnNavigationSVGMap, ColumnNavigationSVGMapProps } from ".";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import { useState } from "react";

interface ColumnIndexMapProps extends ColumnNavigationSVGMapProps {
  col_id: number;
}

function BasicColumnNavigationSVGMap(props: ColumnIndexMapProps) {
  return h(
    MacrostratDataProvider,
    h(ColumnNavigationSVGMap, { style: { width: 500, height: 500 }, ...props }),
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column navigation (SVG)",
  component: BasicColumnNavigationSVGMap,
} as Meta<typeof ColumnNavigationSVGMap>;

export const StaticColumnView = {
  args: {
    center: [-100, 38],
  },
};

export function Interactive() {
  const [currentColumn, setCurrentColumn] = useState(null);
  return h(BasicColumnNavigationSVGMap, {
    currentColumn,
    setCurrentColumn,
  });
}

export function ShowingTriangulation() {
  const [currentColumn, setCurrentColumn] = useState(null);
  return h(BasicColumnNavigationSVGMap, {
    currentColumn,
    setCurrentColumn,
    showDebugLayers: true,
  });
}
