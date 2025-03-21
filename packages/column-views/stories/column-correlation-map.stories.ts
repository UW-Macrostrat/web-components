import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react";
import { InsetMap } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Cross section creation map",
  component: InsetMap,
  description: "Cross section creation map",
} as Meta<typeof InsetMap>;

export function CrossSectionCreatorMap() {
  return h(InsetMap, {
    style: { width: "100%", height: "400px" },
    accessToken: mapboxToken,
  });
}
