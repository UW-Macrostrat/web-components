import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  DataPanel,
  DataPanelToolbarStyle,
  SelectionInteractionStyle,
  type TableAction,
  type TableFilter,
} from "../../src";
import { RegionCardinality } from "@blueprintjs/table";
import { ALL, container, fullSpec, Sample, SampleCard } from "./utils.ts";
import { InputGroup } from "@blueprintjs/core";

/**
 * Where the view controls live, and how they get out of the way.
 *
 * Two settings decide this, and they're coupled enough to be worth trying
 * against each other — hence the arg controls rather than a story per
 * combination:
 *
 *  - **`viewControls`** — `"inline"` (default) puts each control in the toolbar;
 *    `"popover"` collapses all of them behind a single button.
 *  - **`toolbarStyle`** — how much toolbar there is to put them in. `floating`
 *    sizes the toolbar to its contents and lifts it over the scroll body, so a
 *    row of inline controls costs real space there and `popover` starts to pay;
 *    `bordered` gives them a full-width bar to sit in.
 *
 * Selection is the third party to the arrangement. On a modal view, entering
 * select mode replaces the view controls entirely with one **Filter** control
 * that *leaves* select mode — the toolbar belongs to the selection and its
 * set-actions while it lasts. That's not only about space: rows are selected by
 * *index*, so a filter or sort change re-points them (the store drops row
 * selections on a view change for exactly that reason), which means the two
 * shouldn't coexist in the first place.
 *
 * Try: cmd/ctrl-click a card to enter select mode in one gesture; hit
 * **Filter** to get back out.
 */
const meta: Meta<any> = {
  title: "Data sheet/Data panel/View controls",
  parameters: { layout: "fullscreen" },
  argTypes: {
    viewControls: {
      control: { type: "inline-radio" },
      options: ["inline", "popover"],
      description: "Placement of the built-in filter/sort controls.",
    },
    toolbarStyle: {
      control: { type: "select" },
      options: ["bordered", "fade", "minimal", "floating"],
      description: "Toolbar chrome — and so how much room the controls have.",
    },
    enableSelection: {
      control: { type: "inline-radio" },
      options: ["modal", "always", "never"],
      description:
        "Modal selection is what makes the controls step aside; the other styles never do.",
    },
  },
  args: {
    viewControls: "inline",
    toolbarStyle: DataPanelToolbarStyle.BORDERED,
    enableSelection: SelectionInteractionStyle.MODAL,
  },
  render({ viewControls, toolbarStyle, enableSelection }) {
    return container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        filters: [searchFilter],
        actions: [archiveAction],
        name: "Samples",
        itemLabel: "sample",
        viewControls,
        toolbarStyle,
        enableSelection,
      }),
    );
  },
};
export default meta;

/** An always-visible search box, so an `"inline"`-presentation filter is in the
 * mix — it collapses along with the rest under `popover`. */
const searchFilter: TableFilter<Sample, { value: string }> = {
  id: "search",
  name: "Search",
  icon: "search",
  defaultState: { value: "" },
  presentation: "inline",
  describeState: (s) => s?.value || null,
  predicate: (row, s) => {
    const q = (s?.value ?? "").trim().toLowerCase();
    if (q === "") return true;
    return row.name.toLowerCase().includes(q);
  },
  filterForm: ({ state, setState }) =>
    h(InputGroup, {
      leftIcon: "search",
      placeholder: "Search samples…",
      value: state?.value ?? "",
      onValueChange: (value: string) => setState({ value }),
    }),
};

/** A selection-scoped action, so select mode has something to be *for*. */
const archiveAction: TableAction<Sample> = {
  id: "archive",
  name: "Archive",
  icon: "archive",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: false,
  run: (ctx) => {
    const rows = ctx.getSelectedRows();
    console.log("archive", rows.length, "samples");
  },
};

/** The default arrangement: every control in a full-width bordered toolbar. */
export const InlineControls: StoryObj = {};

/** The same controls behind one button. Compare against `InlineControls` in the
 * same toolbar to see what it buys — and costs. */
export const PopoverControls: StoryObj = {
  args: { viewControls: "popover" },
};

/** A floating toolbar sized to its contents: the case `popover` exists for.
 * Switch `viewControls` here to watch the toolbar grow to hold the whole row. */
export const FloatingToolbar: StoryObj = {
  args: {
    viewControls: "popover",
    toolbarStyle: DataPanelToolbarStyle.FLOATING,
  },
};

/** With modal selection off, the controls have the toolbar to themselves and
 * never step aside. */
export const NoSelection: StoryObj = {
  args: { enableSelection: SelectionInteractionStyle.NEVER },
};
