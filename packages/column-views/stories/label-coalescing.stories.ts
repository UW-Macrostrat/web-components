import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react-vite";
import { FlexRow } from "@macrostrat/ui-components";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import "@macrostrat/style-system";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";

/** A ChinaLex column (Fujian east to south) whose formations are split into
 * several lithologic units. In process, so only on the development server. */
const columnID = 63946;

function DevColumn(props: StandaloneColumnProps) {
  return h(
    MacrostratDataProvider,
    { baseURL: "https://dev.macrostrat.org/api/v2" },
    h(StandaloneColumn, props),
  );
}

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Label coalescing",
  component: DevColumn,
  args: {
    id: columnID,
    inProcess: true,
    showLabelColumn: true,
    t_age: 190,
    b_age: 290,
  },
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 900,
      },
    },
  },
};

export default meta;

type Story = StoryObj<StandaloneColumnProps>;

export const Coalesced: Story = {};

/** Click a unit or a coalesced note to see which unit it selects. A coalesced
 * note selects the topmost unit of its run. */
export const WithUnitPopover: Story = {
  args: {
    showUnitPopover: true,
    keyboardNavigation: true,
  },
};

export const NotCoalesced: Story = {
  args: {
    coalesceLabels: false,
  },
};

export const Comparison: Story = {
  render(args) {
    return h(FlexRow, { gap: "2em" }, [
      h(DevColumn, args),
      h(DevColumn, { ...args, coalesceLabels: false }),
    ]);
  },
};
