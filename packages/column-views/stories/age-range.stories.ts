//https://dev.macrostrat.org/api/v2/mobile/map_query_v2?lng=-105.2931&lat=40.0872&z=11.2

import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useAPIResult } from "@macrostrat/ui-components";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { UnitDetailsPanelProps, ExtUnit, IntervalProportions } from "../src";
import { useColumnUnits } from "./column-ui/utils";
import {
  MacrostratInteractionProvider,
  TagSize,
} from "@macrostrat/data-components";

function useUnitData(unit_id, inProcess = false) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    {
      unit_id,
      response: "long",
      status_code: inProcess ? "in process" : undefined,
    },
    (res) => res.success.data[0],
  );
}

function IntervalProportionsExt({
  unit_id,
  inProcess,
  ...rest
}: {
  unit_id: number;
  inProcess?: boolean;
}) {
  const unit = useUnitData(unit_id, inProcess);

  if (unit == null) {
    return null;
  }

  return h(IntervalProportions, { unit, ...rest });
}

type Story = StoryObj<typeof IntervalProportionsExt>;

const meta: Meta<UnitDetailsPanelProps> = {
  title: "Column views/Unit details/Age intervals",
  component: IntervalProportionsExt,
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
  },
};

export const ChinleFormation: Story = {
  args: {
    unit_id: 14779,
  },
};

export const ChinleFormationLarge: Story = {
  args: {
    unit_id: 14779,
    size: TagSize.Large,
  },
};

export const ChinleFormationWithAgeRanges: Story = {
  args: {
    unit_id: 14779,
    showAgeRange: true,
  },
};

export const ChinleFormationWithAgeRangesMultiline: Story = {
  args: {
    unit_id: 14779,
    showAgeRange: true,
    multiLine: true,
  },
};

export const ChinleFormationWithHiddenProportions: Story = {
  args: {
    unit_id: 14779,
    showAgeRange: true,
    showProportions: false,
    multiLine: true,
  },
};

export const IndianolaGroup: Story = {
  args: {
    unit_id: 14737,
  },
};

export const MoenkopiFormation: Story = {
  args: {
    unit_id: 14778,
  },
};

export const eODPMudstone: Story = {
  args: {
    unit_id: 62623,
  },
};

export function WithExternalLinks(args: Omit<UnitDetailsPanelProps, "unit">) {
  // Need to get column units first in order to set up navigation
  const units = useColumnUnits(432) as ExtUnit[] | null;

  if (units == null) return h(Spinner);

  const domain = "https://dev.macrostrat.org";

  return h(
    MacrostratInteractionProvider,
    { linkDomain: domain },
    h(IntervalProportions, { unit: units[0] }),
  );
}
export function WithMapQueryAPI(args: Omit<UnitDetailsPanelProps, "unit">) {
  // Need to get column units first in order to set up navigation
  const res = useAPIResult(
    "/mobile/map_query_v2?lng=-105.2931&lat=40.0872&z=11.2",
  );
  const mapData = res?.mapData?.[0]?.macrostrat;

  if (mapData == null) return h(Spinner);
  console.log(mapData);

  return h(IntervalProportions, {
    unit: {
      b_int_id: mapData.b_int.int_id,
      t_int_id: mapData.t_int.int_id,
    },
  });
}
