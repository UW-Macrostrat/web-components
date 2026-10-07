import hyper from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import "@macrostrat/style-system";
import {
  createMacrostratStore,
  MacrostratDataProvider,
} from "@macrostrat/data-provider";
import { TagSize } from "@macrostrat/data-components";
import {
  AgeRangeFlavor,
  IntervalAgeRange,
  type IntervalAgeRangeData,
  type IntervalAgeRangeProps,
} from "../src";
import styles from "./interval-age-range.stories.module.sass";
import {
  examples,
  examplesByName,
  intervals,
} from "./interval-age-range.fixtures";

const h = hyper.styled(styles);

/**
 * A span of time as the interval(s) it runs between. `flavor` picks what
 * accompanies the interval names: positions within the intervals, ages, or
 * both. Positions, and ages on an interval's boundary, go in the interval's
 * tag; an age within the interval is the span's own, and follows the tag.
 * `verbose` always prints the position or age, even where the interval
 * boundary implies it. With `both`, boundary ages always show in the tags.
 *
 * These stories run from fixtures (interval definitions and units copied from
 * the Macrostrat API), so they need no network.
 */
const meta: Meta<IntervalAgeRangeProps> = {
  title: "Column views/Unit details/Interval age range",
  component: IntervalAgeRange,
  decorators: [(Story) => h(FixtureIntervalsProvider, null, h(Story))],
};

export default meta;

type Story = StoryObj<PlaygroundProps>;

/** Every case under every flavor, with and without `verbose`. */
export const AllFlavors: Story = {
  render: () => h(FlavorMatrix),
};

interface PlaygroundProps extends Omit<IntervalAgeRangeProps, "unit"> {
  example: string;
}

/** One case, with the props as controls. */
export const Playground: Story = {
  args: {
    example: "Chinle Fm",
    flavor: AgeRangeFlavor.Proportion,
    verbose: false,
    size: TagSize.Normal,
  },
  argTypes: {
    example: {
      control: "select",
      options: Object.keys(examplesByName()),
    },
    flavor: {
      control: "inline-radio",
      options: Object.values(AgeRangeFlavor),
    },
    size: {
      control: "inline-radio",
      options: Object.values(TagSize),
    },
  },
  render: ({ example, ...rest }) => {
    const { unit, note } = examplesByName()[example];
    return h("div.playground", [
      h(IntervalAgeRange, { unit, ...rest }),
      h("p.note", note),
    ]);
  },
};

/** Large tags, as in a unit details panel heading. */
export const Large: Story = {
  render: () => h(FlavorMatrix, { size: TagSize.Large }),
};

function FlavorMatrix({ size }: { size?: TagSize }) {
  const [showData, setShowData] = useState(false);
  return h("div.matrix-container", [
    h("label.toggle", [
      h("input", {
        type: "checkbox",
        checked: showData,
        onChange: (evt) => setShowData(evt.target.checked),
      }),
      " Show the unit's raw interval data",
    ]),
    h("table.matrix", [
      h("thead", [
        h("tr", [
          h("th", "Flavor"),
          h("th", "Default"),
          h("th", [h("code", "verbose")]),
        ]),
      ]),
      h(
        "tbody",
        examples.map((ex) =>
          h(ExampleRows, {
            key: ex.name,
            example: ex,
            size,
            showData: showData,
          }),
        ),
      ),
    ]),
  ]);
}

function ExampleRows({ example, size, showData }) {
  const { name, note, unit } = example;
  return h([
    h("tr.case-header", [
      h("th", { colSpan: 3 }, [
        h("span.case-name", name),
        h("span.case-note", note),
        h.if(showData)("code.case-data", formatUnitData(unit)),
      ]),
    ]),
    Object.values(AgeRangeFlavor).map((flavor) =>
      h("tr", { key: flavor }, [
        h("td.flavor", flavor),
        h("td", h(IntervalAgeRange, { unit, flavor, size })),
        h("td", h(IntervalAgeRange, { unit, flavor, size, verbose: true })),
      ]),
    ),
  ]);
}

function formatUnitData(unit: IntervalAgeRangeData): string {
  return Object.entries(unit)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

function FixtureIntervalsProvider({ children }) {
  const [store] = useState(() => {
    const store = createMacrostratStore("fixture://interval-age-range");
    store.setState({
      intervals: new Map(intervals.map((d) => [d.int_id, d])),
    });
    return store;
  });
  return h(MacrostratDataProvider, { store }, children);
}
