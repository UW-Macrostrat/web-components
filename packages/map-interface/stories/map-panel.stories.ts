import type { Meta, StoryObj } from "@storybook/react-vite";

import InfoDrawer from "../src/map-panel/components/info-drawer";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<InfoDrawer> = {
  title: "Map interface/Map Panel",
  component: InfoDrawer,
};

export default meta;

type Story = StoryObj<InfoDrawer>;

export const Primary: Story = {
  args: {
    position: { lat: 44.60085563149249, lng: -96.16783150353609 },
    zoom: 3.9392171056922325,
  }
};