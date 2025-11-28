import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useAPIResult } from "@macrostrat/ui-components";

import { Button, Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { UnitDetailsPanel } from "../src/unit-details";
import { LithologiesProvider } from "../src";

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
    inProcess: true,
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
