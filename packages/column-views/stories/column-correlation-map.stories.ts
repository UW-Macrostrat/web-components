import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import { ColumnCorrelationMap, InsetMap } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Cross section creation map",
  component: ColumnCorrelationMap,
  description: "Cross section creation map",
} as Meta<typeof ColumnCorrelationMap>;

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

export function withPreloadedCrossSection() {
  return h(ColumnCorrelationMap, {
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
  });
}

// export function ColumnCorrelationMapTest() {
//   return h(ColumnCorrelationMap, {
//     style: { width: "800px", height: "600px" },
//     accessToken: mapboxToken,
//     padding: 100,
//   });
// }
//
// export function
