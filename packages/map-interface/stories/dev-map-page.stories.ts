import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";

import { DevMapPage } from "../src";
import Box from "ui-box";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof DevMapPage> = {
  title: "Map interface/Dev map page",
  component: DevMapPage,
};

export default meta;

const mapboxToken = import.meta.env.STORYBOOK_MAPBOX_API_TOKEN;

export function DevMapPageTest() {
  return h(
    Box,
    { className: "container", position: "relative", height: 500 },
    h(DevMapPage, {
      mapboxToken,
      fitViewport: false,
    })
  );
}
