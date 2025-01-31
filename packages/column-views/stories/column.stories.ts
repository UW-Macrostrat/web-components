import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";
import {
  DarkModeProvider,
  JSONView,
  useAPIResult,
} from "@macrostrat/ui-components";

import {
  Column,
  preprocessUnits,
  UnitKeyboardNavigation,
  UnitSelectionProvider,
  useSelectedUnit,
} from "../src";
import { Spinner } from "@blueprintjs/core";
import { PatternProvider } from "@macrostrat/column-components/stories/base-section";
import "@macrostrat/style-system";
import { UnitSelectionPopover } from "../src/selection-popover";
import { createRef, DOMElement, useEffect, useState } from "react";
import { RectBounds } from "../src/units/boxes";

const h = hyper.styled(styles);

interface ColumnProps {
  id: number;
  unconformityLabels?: boolean;
  showLabelColumn?: boolean;
  t_age?: number;
  b_age?: number;
}

function useColumnUnits(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long" },
    (res) => res.success.data
  );
}

function useColumnBasicInfo(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id },
    (res) => {
      return res.success.data[0];
    }
  );
}

function BasicColumn(props: ColumnProps) {
  const info = useColumnBasicInfo(props.id);
  const units = useColumnUnits(props.id);

  if (units == null || info == null) {
    return h(Spinner);
  }

  let units1 = units;
  if (props.t_age != null) {
    units1 = units.filter((d) => d.t_age >= props.t_age);
  }
  if (props.b_age != null) {
    units1 = units1.filter((d) => d.b_age <= props.b_age);
  }

  const data = preprocessUnits(units1);

  return h("div", [h("h2", info.col_name), h(Column, { ...props, data })]);
}

type Story = StoryObj<typeof BasicColumn>;

const meta: Meta<ColumnProps> = {
  title: "Column views/Stratigraphic columns",
  component: BasicColumn,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabels: true,
  },
  decorators: [
    (Story) => {
      return h(DarkModeProvider, h(PatternProvider, h(Story)));
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

export const Primary: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export

export const FilteredToAgeRange: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    t_age: 0,
    b_age: 66,
  },
};

export const Wide: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    t_age: 0,
    b_age: 66,
    width: 500,
    columnWidth: 500,
    unitComponentProps: {
      nColumns: 2,
    },
  },
};

export function BasicUnitViewer() {
  const unit = useSelectedUnit();
  if (unit == null) {
    return null;
  }

  return h("div.unit-viewer", JSONView({ data: unit, showRoot: false }));
}

export function WithBasicUnitSelection() {
  return h(
    UnitSelectionProvider,
    h(BasicColumn, { id: 432, showLabelColumn: true }, [h(BasicUnitViewer)])
  );
}

export function WithUnitSelectionPopover() {
  const ref = createRef<HTMLElement>();
  // Selected item position
  const [position, setPosition] = useState<RectBounds | null>(null);

  return h(
    UnitSelectionProvider,
    {
      onUnitSelected: (unit, target: SVGElement | HTMLElement | null) => {
        if (unit == null) {
          setPosition(null);
          return;
        }
        const el: HTMLElement = ref.current;
        if (el == null || target == null) return;
        const rect = el.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        setPosition({
          x: targetRect.left - rect.left,
          y: targetRect.top - rect.top,
          width: targetRect.width,
          height: targetRect.height,
        });
      },
    },
    h(
      BasicColumn,
      {
        id: 432,
        showLabelColumn: true,
        columnRef: ref,
        keyboardNavigation: true,
      },
      [h(UnitSelectionPopover, { position })]
    )
  );
}
