import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";
import Box from "ui-box";

import { MapAreaContainer } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapAreaContainer> = {
  title: "Map interface/Map area container",
  component: MapAreaContainer,
};

export default meta;

export const Container = {
  render() {
    return h(MapAreaContainer, {
      navbar: h(Box, { backgroundColor: "blue", minHeight: 50 }),
      contextPanel: h(Box, { backgroundColor: "dodgerblue", flex: 1 }),
      mainPanel: h(Box, { backgroundColor: "red", flex: 1 }),
      detailPanel: h(Box, {
        backgroundColor: "magenta",
        flex: 1,
      }),
    });
  },
};
