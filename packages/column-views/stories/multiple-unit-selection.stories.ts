import hyper from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Button } from "@blueprintjs/core";
import classNames from "classnames";
import "@macrostrat/style-system";
import {
  AgeRangeFlavor,
  BasicUnitComponent,
  Column,
  IntervalAgeRange,
} from "../src";
import res from "./data/illinois-432.json";
import styles from "./multiple-unit-selection.stories.module.sass";

const h = hyper.styled(styles);

/**
 * Multiple unit selection. With `allowMultipleSelection`, ⌘/Ctrl-click adds
 * or removes a unit and Shift-click selects the run of units between the last
 * one picked and the one clicked; a plain click (or the column background)
 * starts over. `onUnitsSelected` reports every selected unit, and
 * `selectedUnits` controls the selection. The last unit picked stays the
 * "primary" selection that `onUnitSelected`, the popover and keyboard
 * navigation follow.
 *
 * Runs from a fixture of the Illinois Basin column (#432).
 */
const meta: Meta<StoryProps> = {
  title: "Column views/Unit selection/Multiple selection",
  component: MultipleSelectionDemo,
  args: {
    flavor: AgeRangeFlavor.Proportion,
    verbose: false,
  },
  argTypes: {
    flavor: {
      control: "inline-radio",
      options: Object.values(AgeRangeFlavor),
    },
  },
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 800,
      },
    },
  },
};

export default meta;

type Story = StoryObj<StoryProps>;

/** Select units in the column; the sidebar lists them with their age ranges. */
export const Primary: Story = {};

/** Single selection, for comparison: modifier keys do nothing special. */
export const SingleSelection: Story = {
  args: { allowMultipleSelection: false },
};

interface StoryProps {
  flavor?: AgeRangeFlavor;
  verbose?: boolean;
  allowMultipleSelection?: boolean;
}

function MultipleSelectionDemo({
  flavor,
  verbose,
  allowMultipleSelection = true,
}: StoryProps) {
  const units = res.success.data as any[];
  const [selectedIDs, setSelectedIDs] = useState<number[]>([]);
  const [primaryID, setPrimaryID] = useState<number | null>(null);

  const unitsByID = useMemo(
    () => new Map(units.map((u) => [u.unit_id, u])),
    [units],
  );
  const selected = selectedIDs.map((id) => unitsByID.get(id));

  // A preset, to show the selection being controlled from outside
  const silurian = useMemo(
    () =>
      units
        .filter((u) => u.b_age <= 443.8 && u.t_age >= 419.2)
        .map((u) => u.unit_id),
    [units],
  );

  return h("div.demo", [
    h(Column, {
      units,
      unitComponent: BasicUnitComponent,
      allowUnitSelection: true,
      allowMultipleSelection,
      selectedUnits: selectedIDs,
      onUnitsSelected: setSelectedIDs,
      onUnitSelected: setPrimaryID,
      keyboardNavigation: true,
      showLabelColumn: true,
      width: 450,
      columnWidth: 150,
    }),
    h("div.sidebar", [
      h("div.toolbar", [
        h("span.count", selectionLabel(selected.length)),
        h(Button, {
          size: "small",
          disabled: !allowMultipleSelection,
          onClick: () => setSelectedIDs(silurian),
          text: "Select Silurian units",
        }),
        h(Button, {
          size: "small",
          variant: "minimal",
          icon: "cross",
          disabled: selected.length == 0,
          onClick: () => setSelectedIDs([]),
          text: "Clear",
        }),
      ]),
      h.if(selected.length == 0)("p.hint", [
        "Click a unit to select it. ",
        h("kbd", "⌘"),
        "/",
        h("kbd", "Ctrl"),
        "-click adds or removes units; ",
        h("kbd", "Shift"),
        "-click selects a run of units.",
      ]),
      h(
        "ul.selected-units",
        selected.map((unit) =>
          h(
            "li.selected-unit",
            {
              key: unit.unit_id,
              className: classNames({ primary: unit.unit_id == primaryID }),
            },
            [
              h("span.unit-name", unit.unit_name),
              h(IntervalAgeRange, { unit, flavor, verbose }),
            ],
          ),
        ),
      ),
    ]),
  ]);
}

function selectionLabel(n: number): string {
  if (n == 1) return "1 unit selected";
  return `${n} units selected`;
}
