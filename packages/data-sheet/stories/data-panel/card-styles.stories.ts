// Selection is "modal": a toolbar toggle enters select-mode. Outside it, a card
// is a link (its title navigates); inside it, cards show a checkbox and a click
// selects. So item interactivity and selection never fight over the click.
import { DataCard, DataPanel, ItemComponentProps } from "../../src";
import h from "./card-styles.stories.module.sass";
import {
  CATEGORY_INTENT,
  container,
  fetchSamples,
  fullSpec,
  Sample,
} from "./utils.ts";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "@blueprintjs/core";
import { MasonryCard, MasonryScrollBody } from "./layout-helpers.ts";

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Card styles",
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

function GridCard({
  data,
  selected,
  onSelect,
  selectable,
}: ItemComponentProps<Sample>) {
  return h(
    DataCard,
    {
      onSelect,
      selected,
      selectable,
      style: {
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
        height: "100%",
      },
    },
    [
      h("span", { key: "n", style: { fontWeight: 600 } }, data.name),
      h(
        Tag,
        { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
        data.category,
      ),
      h("code", { key: "v", style: { fontSize: 12 } }, `value ${data.value}`),
    ],
  );
}

// A custom scroll-body component: lays the cards out as a CSS grid. It's a
// component (not just a style), so it could just as well add section headers,
// sticky bits, or its own windowing — the panel still owns scroll + paging.
function GridScrollBody({ children }: { children: any }) {
  return h(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "8px",
        alignContent: "start",
      },
    },
    children,
  );
}

/**
 * Several items per row via a custom `scrollBody` component. Paging (windowed
 * `fetchData`) and modifier-key selection are layout-agnostic, so infinite
 * scroll and shift/cmd-select keep working across the grid.
 */
export const GridLayout: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: GridCard,
        pageSize: 24,
        name: "Samples",
        scrollBody: GridScrollBody,
      }),
    ),
};
