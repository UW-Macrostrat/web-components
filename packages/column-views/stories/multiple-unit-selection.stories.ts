import hyper from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Button } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { AgeRangeFlavor } from "@macrostrat/data-components";
import {
  BasicUnitComponent,
  Column,
  MultiUnitPanel,
  UnitSelectionStyle,
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
 * Unit components take a `selectionStyle` (passed here through
 * `unitComponentProps`): a wash and outline (`overlay`, the default), an
 * outline alone (`outline`), an outline with the other units faded
 * (`dim-others`), or an outline with the other units drawn without their
 * background color (`color-selected`). The last two apply only while
 * something is selected.
 *
 * Runs from a fixture of the Illinois Basin column (#432).
 */
const meta: Meta<StoryProps> = {
  title: "Column views/Unit selection/Multiple selection",
  component: MultipleSelectionDemo,
  args: {
    flavor: AgeRangeFlavor.Proportion,
    selectionStyle: UnitSelectionStyle.Overlay,
  },
  argTypes: {
    flavor: {
      control: "inline-radio",
      options: Object.values(AgeRangeFlavor),
    },
    selectionStyle: {
      control: "inline-radio",
      options: Object.values(UnitSelectionStyle),
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

/** Select units in the column; the sidebar lists them in a `MultiUnitPanel`,
 * where clicking a unit narrows the selection to it. */
export const Primary: Story = {};

/** The selection drawn as an outline alone. */
export const OutlineStyle: Story = {
  args: { selectionStyle: UnitSelectionStyle.Outline },
};

/** Units outside the selection fade while something is selected. */
export const DimOthersStyle: Story = {
  args: { selectionStyle: UnitSelectionStyle.DimOthers },
};

/** Only the selected units keep their background color while something is
 * selected. */
export const ColorSelectedStyle: Story = {
  args: { selectionStyle: UnitSelectionStyle.ColorSelected },
};

/** With the column's unit popover: several selected units show as a
 * condensed `MultiUnitPanel`, where clicking a unit narrows the selection to
 * it (and so back to its details). */
export const WithUnitPopover: Story = {
  args: { showUnitPopover: true },
};

/** Single selection, for comparison: modifier keys do nothing special. */
export const SingleSelection: Story = {
  args: { allowMultipleSelection: false },
};

interface StoryProps {
  flavor?: AgeRangeFlavor;
  allowMultipleSelection?: boolean;
  selectionStyle?: UnitSelectionStyle;
  showUnitPopover?: boolean;
}

function MultipleSelectionDemo({
  flavor,
  allowMultipleSelection = true,
  selectionStyle,
  showUnitPopover = false,
}: StoryProps) {
  const units = res.success.data as any[];
  const [selectedIDs, setSelectedIDs] = useState<number[]>([]);
  const [primaryID, setPrimaryID] = useState<number | null>(null);

  // Listed top to bottom, as in the column
  const selected = units.filter((u) => selectedIDs.includes(u.unit_id));
  // Memoized: the column re-renders its units when these props change
  const unitComponentProps = useMemo(
    () => ({ selectionStyle }),
    [selectionStyle],
  );

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
      unitComponentProps,
      allowUnitSelection: true,
      allowMultipleSelection,
      selectedUnits: selectedIDs,
      onUnitsSelected: setSelectedIDs,
      onUnitSelected: setPrimaryID,
      keyboardNavigation: true,
      showUnitPopover,
      showLabelColumn: true,
      width: 450,
      columnWidth: 150,
    }),
    h("div.sidebar", [
      h("div.toolbar", [
        h(Button, {
          size: "small",
          disabled: !allowMultipleSelection,
          onClick: () => setSelectedIDs(silurian),
          text: "Select Silurian units",
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
      h.if(selected.length > 0)(MultiUnitPanel, {
        units: selected,
        primaryUnitID: primaryID,
        ageRangeFlavor: flavor,
        onSelectUnit: (id: number) => setSelectedIDs([id]),
        onClose: () => setSelectedIDs([]),
      }),
    ]),
  ]);
}
