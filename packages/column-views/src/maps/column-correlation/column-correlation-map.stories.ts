import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  CorrelationMapProps,
  CorrelationProviderProps,
} from ".";
import { InsetMap } from "../_shared";

function ColumnCorrelationMapExt(
  props: CorrelationMapProps & CorrelationProviderProps
) {
  const {
    focusedLine,
    columns,
    onSelectColumns,
    projectID,
    inProcess,
    ...rest
  } = props;

  return h(
    ColumnCorrelationProvider,
    {
      focusedLine,
      columns,
      onSelectColumns,
      projectID,
      inProcess,
    },
    h(ColumnCorrelationMap, rest)
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column correlation",
  component: ColumnCorrelationMapExt,
  description: "Cross section creation map",
} as Meta<typeof ColumnCorrelationMapExt>;

export function BasicInsetMap() {
  return h(InsetMap, {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
  });
}

export const ColumnCorrelation = {
  args: {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    padding: 100,
  },
};

export const withPreloadedCrossSection = {
  args: {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    padding: 100,
    focusedLine: {
      type: "LineString",
      coordinates: [
        [-122.399, 37.791],
        [-100, 45],
      ],
    },
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
