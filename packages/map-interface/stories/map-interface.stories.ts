import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Box } from "@macrostrat/ui-components";

import { MapAreaContainer, DetailPanelStyle } from "../src";

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
  args: {
    detailPanel: h(Box, {
      backgroundColor: "magenta",
      flex: 1,
      minHeight: 50,
    }),
  },
  argTypes: {
    detailPanelStyle: {
      control: "inline-radio",
      options: [DetailPanelStyle.FLOATING, DetailPanelStyle.FIXED],
    },
  },
  render(props) {
    return h(MapAreaContainerDemo, props);
  },
};

export default meta;

function MapAreaContainerDemo(props: any) {
  const { navbar, contextPanel, mainPanel, detailPanel, mapControls, ...rest } =
    props;

  return h(MapAreaContainer, {
    navbar: navbar ?? h(DemoNavbar),
    contextPanel:
      contextPanel ??
      h(Box, {
        backgroundColor: "dodgerblue",
        flex: 1,
        minHeight: 50,
      }),
    mainPanel:
      mainPanel ?? h(Box, { outline: "2px dotted dodgerblue", flex: 1 }),
    detailPanel,
    mapControls:
      mapControls ??
      h(Box, { backgroundColor: "gray", height: 30, flexShrink: 0 }),
    ...rest,
  });
}

function DemoNavbar({ title = "Macrostrat" }) {
  return h(
    Box,
    {
      backgroundColor: "blue",
      minHeight: 50,
      color: "white",
      margin: 0,
    },
    h(Box, { is: "h1", margin: 0 }, title),
  );
}

/** A scrollable stand-in for panel content of a given length */
function DemoPanel({ color, nParagraphs = 1, ...rest }) {
  return h(
    Box,
    {
      backgroundColor: color,
      flex: 1,
      padding: "1rem",
      overflowY: "scroll",
      ...rest,
    },
    h("div.content", blurbFor(nParagraphs)),
  );
}

export const BasicContainer = {
  render() {
    return h(MapAreaContainerDemo, {});
  },
};

export const SmallContextPanel = {
  render() {
    return h(MapAreaContainerDemo, {
      contextPanel: h(DemoPanel, { color: "dodgerblue", maxWidth: 250 }),
    });
  },
};

export const LargeContextPanel = {
  args: {
    contextPanel: h(DemoPanel, { color: "dodgerblue", nParagraphs: 10 }),
  },
};

export const LargeDetailPanel = {
  args: {
    detailPanel: h(DemoPanel, { color: "magenta", nParagraphs: 10 }),
  },
};

export const NoDetailPanel = {
  args: {
    detailPanel: null,
  },
};

export const WithPanelOutlines = {
  args: {
    showPanelOutlines: true,
  },
};

/** The "fixed" detail panel is docked beside the map rather than floating
 * over it, so the map region is a well-defined box. */
export const FixedDetailPanel = {
  args: {
    detailPanelStyle: DetailPanelStyle.FIXED,
    detailPanel: h(DemoPanel, { color: "magenta", nParagraphs: 10 }),
  },
};

/** The fixed panel animates out to the right, and the map area reclaims the space. */
export const FixedDetailPanelClosed = {
  args: {
    detailPanelStyle: DetailPanelStyle.FIXED,
    detailPanel: h(DemoPanel, { color: "magenta", nParagraphs: 10 }),
    detailPanelOpen: false,
  },
};

/** Floating panels overlay the map, so the map extends underneath them. */
export const FloatingDetailPanel = {
  args: {
    detailPanelStyle: DetailPanelStyle.FLOATING,
    detailPanel: h(DemoPanel, { color: "magenta", nParagraphs: 10 }),
  },
};

/** With the context panel collapsed, only the navbar remains in the left stack. */
export const ContextPanelClosed = {
  args: {
    contextPanelOpen: false,
    contextPanel: h(DemoPanel, { color: "dodgerblue", nParagraphs: 10 }),
  },
};

/** No context stack at all: the map fills the frame from the left edge. */
export const NoContextStack = {
  args: {
    navbar: null,
    contextPanel: null,
  },
};

/** Only a navbar in the context stack, with no panel below it. */
export const NavbarOnly = {
  args: {
    contextPanel: null,
  },
};

/** An adaptive-width context stack sizes itself to its content
 * rather than to `--map-context-stack-max-width`. */
export const AdaptiveContextWidth = {
  args: {
    contextStackProps: { adaptiveWidth: true },
    contextPanel: h(DemoPanel, { color: "dodgerblue", nParagraphs: 3 }),
  },
};

/** A bottom panel sits below the whole map row (e.g. a cross-section). */
export const WithBottomPanel = {
  args: {
    bottomPanel: h(DemoPanel, {
      color: "darkslateblue",
      nParagraphs: 1,
      height: 150,
      flex: "none",
    }),
  },
};

/** Panel widths are driven by CSS custom properties on the container. */
export const CustomPanelWidths = {
  args: {
    detailPanelStyle: DetailPanelStyle.FIXED,
    detailPanel: h(DemoPanel, { color: "magenta", nParagraphs: 10 }),
    contextPanel: h(DemoPanel, { color: "dodgerblue", nParagraphs: 10 }),
    style: {
      "--map-context-stack-width": "20em",
      "--map-detail-stack-width": "20em",
    },
  },
};

/** All panels populated at once, with outlines to show the layout regions. */
export const FullyPopulated = {
  args: {
    showPanelOutlines: true,
    detailPanelStyle: DetailPanelStyle.FIXED,
    contextPanel: h(DemoPanel, { color: "dodgerblue", nParagraphs: 10 }),
    detailPanel: h(DemoPanel, { color: "magenta", nParagraphs: 10 }),
    bottomPanel: h(DemoPanel, {
      color: "darkslateblue",
      nParagraphs: 1,
      height: 120,
      flex: "none",
    }),
  },
};
