import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import { ColumnCorrelationMap, InsetMap } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Cross section creation map",
  component: InsetMap,
  description: "Cross section creation map",
} as Meta<typeof InsetMap>;

export function BasicInsetMap() {
  return h(InsetMap, {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
  });
}

export function ColumnCorrelationMapTest() {
  return h(ColumnCorrelationMap, {
    style: { width: "800px", height: "600px" },
    accessToken: mapboxToken,
    padding: 100,
  });
}
