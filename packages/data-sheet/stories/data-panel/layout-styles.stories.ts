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
};
export default meta;

/**
 * A masonry layout for variable-height items via a custom `scrollBody`. Uses an
 * append-only, measured column distribution (see `MasonryScrollBody`) so new
 * pages don't reflow the existing layout. Paging and selection are unaffected.
 */
export const Masonry: StoryObj = {
  render: () =>
    container(
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
      }),
    ),
};
