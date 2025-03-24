import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import {
  ColumnNavigationMap,
  ColumnNavigationProvider,
  CorrelationMapProps,
  CorrelationProviderProps,
} from ".";
import { InsetMap } from "../_shared";

function ColumnNavigationMapExt(
  props: CorrelationMapProps & CorrelationProviderProps
) {
  const {
    focusedLine,
    columns,
    apiBaseURL,
    onSelectColumns,
    projectID,
    format,
    statusCode,
    ...rest
  } = props;

  return h(
    ColumnNavigationProvider,
    {
      focusedLine,
      columns,
      apiBaseURL,
      onSelectColumns,
      projectID,
      format,
      statusCode,
    },
    h(ColumnNavigationMap, rest)
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column navigation",
  component: ColumnNavigationMapExt,
  description: "Cross section creation map",
} as Meta<typeof ColumnNavigationMapExt>;

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
