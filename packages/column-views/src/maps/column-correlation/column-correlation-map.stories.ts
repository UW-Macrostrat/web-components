import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react-vite";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  CorrelationMapProps,
  CorrelationProviderProps,
} from ".";

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
    h(ColumnCorrelationMap, { accessToken: mapboxToken, ...rest })
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column correlation",
  component: ColumnCorrelationMapExt,
  description: "Cross section creation map",
} as Meta<typeof ColumnCorrelationMapExt>;

export const ColumnCorrelation = {
  args: {
    style: { width: "800px", height: "600px" },
    padding: 100,
  },
};

export const withPreloadedCrossSection = {
  args: {
    style: { width: "800px", height: "600px" },
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
    padding: 100,
    projectID: 10,
    inProcess: true,
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
    padding: 100,
    projectID: 3,
    inProcess: true,
    mapPosition: {
      camera: {
        lng: -100,
        lat: 38,
        altitude: 5000000,
      },
    },
  },
};
