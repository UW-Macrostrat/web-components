import h from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Breadcrumbs, Text } from "@blueprintjs/core";
import { FloatingNavbar, MapLoadingButton, FloatingNavbarProps } from "../src";
import { Box } from "@macrostrat/ui-components";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";

function BasicNavbar(props: FloatingNavbarProps) {
  return h(FloatingNavbar, {
    rightElement: h(MapLoadingButton),
    ...props,
  });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<FloatingNavbarProps> = {
  title: "Map interface/Components/Floating navbar",
  component: BasicNavbar,
  decorators: [
    (Story) => {
      return h(MapboxMapProvider, h(Story));
    },
  ],
};

export default meta;

type Story = StoryObj<FloatingNavbarProps>;

export const Primary: Story = {
  args: {
    title: "Map inspector",
    width: 250,
  },
  argTypes: {
    title: {
      type: {
        name: "string",
        required: true,
      },
      default: "Map inspector",
    },
  },
};

export const WithStatusBar: Story = {
  args: {
    title: "A map",
    width: 250,
    statusElement: h(
      Box,
      {
        paddingX: 10,
        paddingY: 2,
        backgroundColor: "rgba(255 200 200)",
        color: "red",
      },
      "Bad stuff is afoot"
    ),
  },
};

export const WithExpandedNavigation: Story = {
  args: {
    headerElement: h(
      Box,
      { display: "flex", flexDirection: "column", gap: 5, marginX: 5 },
      [
        h(Breadcrumbs, { items: [{ icon: "home" }, { text: "Map" }] }),
        h(Text, { tagName: "h3", style: { margin: 0 } }, "Map inspector"),
      ]
    ),
    width: 250,
    height: "fit-content",
  },
};

export const WithoutTitle: Story = {
  args: {
    title: null,
    width: "fit-content",
    style: { padding: 5 },
    rightElement: h(MapLoadingButton, {
      large: true,
    }),
  },
};

export const LongTitleWrapped: Story = {
  args: {
    title: h(
      Text,
      {
        tagName: "h2",
        style: { margin: 0 },
      },
      "This is a long title that should wrap"
    ),
    width: 250,
    height: "fit-content",
  },
};

export const LongTitleOverflow: Story = {
  args: {
    title: "This is a long title that should overflow",
    width: 250,
  },
};

export const UnlimitedWidth: Story = {
  args: {
    title: "Map inspector",
  },
};

export const WidthFollowsContent: Story = {
  args: {
    title: "Map inspector (width follows content)",
    width: "fit-content",
  },
};
