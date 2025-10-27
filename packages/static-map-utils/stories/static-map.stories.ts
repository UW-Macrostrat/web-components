import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function InsetMap(props) {
  return h("div", "Hello world");
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof InsetMap> = {
  title: "Static map utils/Inset map",
  component: InsetMap,
};

export default meta;

export const Default: StoryObj<typeof InsetMap> = {};
