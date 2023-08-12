import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";

import { DevMapPage } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof DevMapPage> = {
  title: "Map interface/Dev map page",
  component: DevMapPage,
};

export default meta;

export function DevMapPageTest() {
  return h(DevMapPage, { mapboxToken: import.meta.env.VITE_MAPBOX_API_TOKEN });
}
