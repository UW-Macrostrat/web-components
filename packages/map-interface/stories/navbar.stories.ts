import h from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "@blueprintjs/core";
import { FloatingNavbar, MapLoadingButton } from "../src";
import { Box } from "@macrostrat/ui-components";

interface BasicNavbarProps {
  title: string;
  width: number | string | null;
  height: number | string | null;
}

function BasicNavbar(props: BasicNavbarProps) {
  return h(FloatingNavbar, {
    rightElement: h(MapLoadingButton),
    ...props,
  });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<BasicNavbarProps> = {
  title: "Map interface/Components/Floating navbar",
  component: BasicNavbar,
};

export default meta;

type Story = StoryObj<BasicNavbarProps>;

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

export const NoTitle: Story = {
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
