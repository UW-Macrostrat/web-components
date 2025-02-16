import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react";
import { useAPIResult } from "@macrostrat/ui-components";

import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { UnitDetailsPanel } from "../src/unit-details";

function useUnitData(unit_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { unit_id, response: "long" },
    (res) => res.success.data[0]
  );
}

function UnitDetailsExt({ unit_id, ...rest }: UnitDetailsProps) {
  const unit = useUnitData(unit_id);

  if (unit == null) {
    return h(Spinner);
  }

  return h(UnitDetailsPanel, { unit, ...rest });
}

type Story = StoryObj<typeof UnitDetailsExt>;

interface UnitDetailsProps {
  unit_id: number;
  onClose?: () => void;
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

export const Closeable: Story = {
  args: {
    unit_id: 13103,
    onClose() {
      console.log("Close");
    },
  },
};
