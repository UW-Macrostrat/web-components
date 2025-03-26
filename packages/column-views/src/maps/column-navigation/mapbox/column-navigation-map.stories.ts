import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import { ColumnNavigationMap } from ".";
import { useState } from "react";

function ColumnNavigationMapExt(props) {
  return h(ColumnNavigationMap, {
    style: { width: "800px", height: "600px" },
    padding: 100,
    accessToken: mapboxToken,
    ...props,
  });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column navigation",
  component: ColumnNavigationMapExt,
  description: "Cross section creation map",
} as Meta<typeof ColumnNavigationMap>;

export const ColumnNavigation = {
  args: {
    showTriangulation: false,
  },
};

export const nonStandardProject = {
  args: {
    padding: 100,
    projectID: 10,
    statusCode: "in process",
    showTriangulation: false,
    mapPosition: {
      camera: {
        lng: -72,
        lat: 44,
        altitude: 600000,
      },
    },
  },
};

export const eODP = {
  args: {
    projectID: 3,
    statusCode: "in process",
  },
};

export const showTriangulation = {
  description: "Show the triangulation used for keyboard navigation",
  args: {
    showTriangulation: true,
    columnColor: "#1fff53",
    triangulationColor: "#9a33bb",
  },
};

export const onlyPhysicalBasemap = {
  args: {
    mapStyle: "mapbox://styles/mapbox/outdoors-v11",
    showLabels: true,
    showAdmin: false,
    showRoads: false,
  },
};

export function ControlledColumnNavigation() {
  const [selectedColumn, setSelectedColumn] = useState(157);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  return h("div.controlled-navigation", [
    h(ColumnNavigationMapExt, {
      selectedColumn,
      hoveredColumn,
      onSelectColumn: setSelectedColumn,
      onHoverColumn: setHoveredColumn,
    }),
    h("div.column-info", [
      h("h3", "Selected column"),
      h("p", selectedColumn),
      h("h3", "Hovered column"),
      h("p", hoveredColumn),
    ]),
  ]);
}
