import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  CorrelationMapProps,
  CorrelationProviderProps,
} from "../column-correlation";
import { InsetMap } from "../_shared/inset-map";

function ColumnCorrelationMapExt(
  props: CorrelationMapProps & CorrelationProviderProps
) {
  const { focusedLine, columns, apiBaseURL, onSelectColumns, ...rest } = props;

  return h(
    ColumnCorrelationProvider,
    {
      focusedLine,
      columns,
      apiBaseURL,
      onSelectColumns,
    },
    h(ColumnCorrelationMap, rest)
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column navigation",
  component: ColumnCorrelationMapExt,
  description: "Column navigation map",
} as Meta<typeof ColumnCorrelationMapExt>;

export function BasicInsetMap() {
  return h(InsetMap, {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    mapPosition: {
      camera: {
        lng: -100,
        lat: 38,
        altitude: 5000000,
      },
    },
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

// export function ColumnCorrelationMapTest() {
//   return h(ColumnCorrelationMap, {
//     style: { width: "800px", height: "600px" },
//     accessToken: mapboxToken,
//     padding: 100,
//   });
// }
//
// export function
