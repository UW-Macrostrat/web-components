import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useAPIResult } from "@macrostrat/ui-components";

import { Button, Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { UnitDetailsPanel } from "../src/unit-details";
import {
  ExtUnit,
  LithologiesProvider,
  MacrostratColumnStateProvider,
  UnitSelectionProvider,
  useSelectedUnit,
  useUnitSelectionStore,
} from "../src";
import { useColumnUnits } from "./column-ui/utils";

function useUnitData(unit_id, inProcess = false) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    {
      unit_id,
      response: "long",
      show_position: true,
      status_code: inProcess ? "in process" : undefined,
    },
    (res) => res.success.data[0],
  );
}

function UnitDetailsExt({
  unit_id,
  inProcess,
  ...rest
}: UnitDetailsProps & { inProcess?: boolean }) {
  const unit = useUnitData(unit_id, inProcess);

  if (unit == null) {
    return h(Spinner);
  }

  return h(
    LithologiesProvider,
    h(UnitDetailsPanel, {
      onClickItem: (e, data) => console.log(data),
      unit,
      ...rest,
    }),
  );
}

type Story = StoryObj<typeof UnitDetailsExt>;

interface UnitDetailsProps {
  unit_id: number;
  onClose?: () => void;
  showLithologyProportions?: boolean;
  actions: any;
  hiddenActions: any;
}

const meta: Meta<UnitDetailsProps> = {
  title: "Column views/Unit details",
  component: UnitDetailsExt,
  args: {
    unit_id: 13103,
  },
};

export default meta;

export const Primary: Story = {
  args: {
    unit_id: 13103,
  },
};

export const WithLithologyProportions: Story = {
  args: {
    unit_id: 13103,
    showLithologyProportions: true,
  },
};

export const Closeable: Story = {
  args: {
    unit_id: 13103,
    onClose() {
      console.log("Close");
    },
  },
};

export const ChinleFormation: Story = {
  args: {
    unit_id: 14779,
    showLithologyProportions: true,
  },
};

export const IndianolaGroup: Story = {
  args: {
    unit_id: 14737,
    showLithologyProportions: true,
  },
};

export const MoenkopiFormation: Story = {
  args: {
    unit_id: 14778,
    showLithologyProportions: true,
  },
};

export const eODPMudstone: Story = {
  args: {
    unit_id: 62623,
  },
};

export const WithActions: Story = {
  args: {
    unit_id: 62623,
    onClose() {
      console.log("Close");
    },
    actions: h([
      h(Button, { text: "Action 1", onClick: () => alert("Action 1") }),
    ]),
    hiddenActions: h([
      h(Button, { icon: "add-column-left", onClick: () => alert("Hidden") }),
    ]),
  },
};

export function WithDataProvider(args: UnitDetailsProps) {
  const units = useColumnUnits(432) as ExtUnit[] | null;

  if (units == null) return h(Spinner);

  return h(
    MacrostratColumnStateProvider,
    { units, selectedUnit: units?.[0]?.unit_id },
    h(UnitDetailsWithSelection),
  );
}

function UnitDetailsWithSelection(args: UnitDetailsProps) {
  const unit = useSelectedUnit();
  const setSelectedUnit = useUnitSelectionStore((s) => s.onUnitSelected);
  if (unit == null) return h("div", "No unit selected");
  return h(UnitDetailsPanel, {
    unit,
    onSelectUnit(unit) {
      setSelectedUnit(unit, null, null);
    },
  });
}
