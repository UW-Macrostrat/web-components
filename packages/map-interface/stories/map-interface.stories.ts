import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react-vite";
import { Box } from "@macrostrat/ui-components";

import { MapAreaContainer } from "../src";

/** TODO: integrate this into a design-helpers area */
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum();

function blurbFor(nParagraphs): ReactNode[] {
  const paras = lorem.generateParagraphs(nParagraphs).split("\n");
  return paras.map((p) => h("p", p));
}
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapAreaContainer> = {
  title: "Map interface/Map area container",
  component: MapAreaContainer,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
};

export default meta;

function MapAreaContainerDemo(props: any) {
  const { navbar, contextPanel, mainPanel, detailPanel, mapControls } = props;

  return h(MapAreaContainer, {
    navbar:
      navbar ??
      h(
        Box,
        {
          backgroundColor: "blue",
          minHeight: 50,
          color: "white",
          margin: 0,
        },
        h(Box, { is: "h1", margin: 0 }, "Macrostrat"),
      ),
    contextPanel:
      contextPanel ??
      h(Box, {
        backgroundColor: "dodgerblue",
        flex: 1,
        minHeight: 50,
      }),
    mainPanel:
      mainPanel ?? h(Box, { outline: "2px dotted dodgerblue", flex: 1 }),
    detailPanel:
      detailPanel ??
      h(Box, {
        backgroundColor: "magenta",
        flex: 1,
        minHeight: 50,
      }),
    mapControls: mapControls ?? h(Box, { backgroundColor: "gray", height: 30 }),
  });
}

export const BasicContainer = {
  render() {
    return h(MapAreaContainerDemo, {});
  },
};

export const SmallContextPanel = {
  render() {
    return h(MapAreaContainerDemo, {
      contextPanel: h(
        Box,
        {
          backgroundColor: "dodgerblue",
          flex: 1,
          padding: "1rem",
          overflowY: "scroll",
          maxWidth: 250,
        },
        h("div.content", blurbFor(1)),
      ),
    });
  },
};

export const LargeContextPanel = {
  render() {
    return h(MapAreaContainerDemo, {
      contextPanel: h(
        Box,
        {
          backgroundColor: "dodgerblue",
          flex: 1,
          padding: "1rem",
          overflowY: "scroll",
        },
        h("div.content", blurbFor(10)),
      ),
    });
  },
};
