import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";
import { useAPIResult } from "@macrostrat/ui-components";

import {
  Column,
  LithologiesProvider,
  ColoredUnitComponent,
  preprocessSectionUnits,
  preprocessUnits,
} from "@macrostrat/column-views";
import { Spinner } from "@blueprintjs/core";
import { PatternProvider } from "@macrostrat/column-components/stories/base-section";
import "@macrostrat/style-system";
import { ColumnProps as BaseColumnProps } from "@macrostrat/column-views";
import { ColumnAxisType } from "@macrostrat/column-components";

const h = hyper.styled(styles);

interface ColumnProps extends BaseColumnProps {
  id: number;
}

function useColumnUnits(col_id, inProcess) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code, show_position: true },
    (res) => res.success.data
  );
}

function useColumnBasicInfo(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id, status_code },
    (res) => {
      return res.success.data[0];
    }
  );
}

function BasicSection(props: ColumnProps & { inProcess?: boolean }) {
  const { id, inProcess, ...rest } = props;
  const info = useColumnBasicInfo(id, inProcess);
  const units = useColumnUnits(id, inProcess);

  if (units == null || info == null) {
    return h(Spinner);
  }

  const data = preprocessUnits(units, rest.axisType);

  return h("div", [h("h2", info.col_name), h(Column, { ...rest, data })]);
}

type Story = StoryObj<typeof BasicSection>;

const meta: Meta<ColumnProps> = {
  title: "Column views/Stratigraphic sections",
  component: BasicSection,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabelColumn: true,
    columnWidth: 200,
    width: 400,
    unitComponent: ColoredUnitComponent,
    showUnitPopover: true,
    keyboardNavigation: true,
    axisType: ColumnAxisType.DEPTH,
  },
  decorators: [
    (Story) => {
      return h(LithologiesProvider, h(PatternProvider, h(Story)));
    },
  ],
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 700,
      },
    },
  },
};

export default meta;

export const eODPColumn: Story = {
  args: {
    id: 5576,
    inProcess: true,
  },
};

export const eODPColumnV2: Story = {
  args: {
    id: 5248,
    inProcess: true,
  },
};

export const NormalColumnOrdinalPosition: Story = {
  args: {
    id: 432,
    axisType: ColumnAxisType.ORDINAL,
  },
};
