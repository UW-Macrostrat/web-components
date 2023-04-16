import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";

import { MapInterface } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapInterface> = {
  title: "Map interface/Map interface",
  component: MapInterface,
};

export default meta;

export const Primary = {
  render() {
    return h(MapInterface, {});
  },
};
