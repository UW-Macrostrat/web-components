import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import { ColumnNavigationMap } from ".";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column navigation",
  component: ColumnNavigationMap,
  description: "Cross section creation map",
} as Meta<typeof ColumnNavigationMap>;

export const ColumnNavigation = {
  args: {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    padding: 100,
  },
};

export const nonStandardProject = {
  args: {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    padding: 100,
    projectID: 10,
    statusCode: "in process",
    mapPosition: {
      camera: {
        lng: -100,
        lat: 38,
        altitude: 5000000,
      },
    },
  },
};

export const eODP = {
  args: {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    padding: 100,
    projectID: 3,
    statusCode: "in process",
    mapPosition: {
      camera: {
        lng: -100,
        lat: 38,
        altitude: 5000000,
      },
    },
  },
};
