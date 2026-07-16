// Selection is "modal": a toolbar toggle enters select-mode. Outside it, a card
// is a link (its title navigates); inside it, cards show a checkbox and a click
// selects. So item interactivity and selection never fight over the click.
import { DataPanel } from "../../src";
import h from "./card-styles.stories.module.sass";
import { container, fetchSamples, fullSpec, Sample } from "./utils.ts";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MasonryCard, MasonryScrollBody } from "./layout-helpers.ts";

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Layouts",
  parameters: { layout: "fullscreen" },
  argTypes: {
    // toolbarStyle: {
    //   control: { type: "select" },
    //   options: ["bordered", "transparent"],
    // },
  },
  render(args) {
    const { toolbarStyle } = args;
    return container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        className: "masonry-panel",
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: MasonryCard,
        pageSize: 24,
        name: "Samples",
        itemLabel: "sample",
        scrollBody: MasonryScrollBody,
        toolbarStyle,
      }),
    );
  },
};
export default meta;

export const Bordered: StoryObj = {
  args: {
    toolbarStyle: "bordered",
  },
};

export const Fade: StoryObj = {
  args: {
    toolbarStyle: "fade",
  },
};

export const Floating: StoryObj = {
  args: {
    toolbarStyle: "floating",
  },
};
