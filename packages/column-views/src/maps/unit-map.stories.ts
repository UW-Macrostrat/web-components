import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { InsetMap } from "./inset-map";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import { MacrostratUnitsOverlay } from "./layers/units";
import {
  ColumnHoverInteraction,
  ColumnSelectionManager,
} from "./column-navigation";
import { useState } from "react";

// @ts-ignore
const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Unit map",
  component: UnitMapComponent,
  description: "A map of units through time",
  argTypes: {
    time: { control: "number", defaultValue: 100 },
    ageSpan: { control: "number", defaultValue: 0.05 },
    patterns: { control: "boolean", defaultValue: false },
  },
} as Meta<typeof InsetMap>;

function UnitMapComponent(props) {
  const { children, ...rest } = props;
  return h(
    MacrostratDataProvider,
    {
      baseURL: "https://dev.macrostrat.org/api/v2",
    },
    h(
      "div",
      h(
        InsetMap,
        {
          style: { width: "800px", height: "600px" },
          accessToken: mapboxToken,
        },
        [h(MacrostratUnitsOverlay, rest), children],
      ),
    ),
  );
}

export const UnitMap = {
  args: {
    time: 100,
    ageSpan: 0.05,
  },
};

export const WithPatterns = {
  args: {
    time: 100,
    ageSpan: 0.05,
    patterns: true,
  },
};

export const WithColumnSelection = {
  args: {
    time: 100,
    ageSpan: 0.05,
    patterns: false,
  },
  render(args) {
    const [selectedColumn, setSelectedColumn] = useState(null);
    return h(UnitMapComponent, args, [
      h(ColumnHoverInteraction),
      h(ColumnSelectionManager, {
        selectedColumn,
        onSelectColumn: setSelectedColumn,
      }),
    ]);
  },
};
