/** Theming the selection and hover colors of the column maps and the column
 * itself with CSS custom properties — one set of variables on a containing
 * element colors every view inside it. */
import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import { Spinner } from "@blueprintjs/core";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import {
  Column,
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  ColumnNavigationMap,
  columnMapColorVariables,
} from "../../src";
import { useColumnUnits } from "../column-animations/utils";
import styles from "./selection-colors.stories.module.sass";
import { hyperStyled } from "@macrostrat/hyper";

const hs = hyperStyled(styles);

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
const apiDomain = "https://dev.macrostrat.org";

// A `className` passed to the map isn't scoped by this story's CSS module (only
// elements the styled `h` creates are), so the map is sized inline instead.
const mapStyle = { width: "100%", height: "100%" };

interface ThemingArgs {
  /** `--column-map-color`: column footprints */
  columnColor: string;
  /** `--column-map-hover-color`: the hovered / highlighted column */
  hoverColor: string;
  /** `--column-map-selection-color`: the navigation map's selected column */
  selectionColor: string;
  /** `--column-map-focus-color`: the correlation map's focused columns */
  focusColor: string;
  /** `--selection-overlay-color`: the selected unit in a column */
  unitSelectionColor: string;
  /** `--selection-overlay-opacity` */
  unitSelectionOpacity: number;
}

function ThemedColumnViews(args: ThemingArgs) {
  // The maps read the variables from their container when they mount, so a
  // change to any of them remounts the views (the `key`).
  const style = {
    [columnMapColorVariables.column.variable]: args.columnColor,
    [columnMapColorVariables.hover.variable]: args.hoverColor,
    [columnMapColorVariables.selection.variable]: args.selectionColor,
    [columnMapColorVariables.focus.variable]: args.focusColor,
    "--selection-overlay-color": args.unitSelectionColor,
    "--selection-overlay-opacity": args.unitSelectionOpacity,
  } as any;
  const key = JSON.stringify(style);

  return h(
    MacrostratDataProvider,
    { baseURL: apiDomain + "/api/v2" },
    hs("div.themed-views", { style, key }, [
      hs("div.view", [
        hs("h4", "Navigation map"),
        hs("p.hint", "Hover a column; the selected column is the Paradox Basin."),
        hs(
          "div.map",
          h(ColumnNavigationMap, {
            accessToken: mapboxToken,
            style: mapStyle,
            projectID: 1,
            selectedColumn: 495,
            padding: 60,
          }),
        ),
      ]),
      hs("div.view", [
        hs("h4", "Correlation map"),
        hs("p.hint", "Focused columns along a line of section; hover one."),
        hs(
          "div.map",
          h(
            ColumnCorrelationProvider,
            {
              columns: null,
              projectID: 1,
              focusedLine: {
                type: "LineString",
                coordinates: [
                  [-114.29, 42.74],
                  [-104.59, 39.21],
                ],
              },
            },
            h(ColumnCorrelationMap, {
              accessToken: mapboxToken,
              style: mapStyle,
              padding: 60,
            }),
          ),
        ),
      ]),
      hs("div.view", [
        hs("h4", "Column"),
        hs("p.hint", "The selected unit's overlay uses the column variables."),
        hs("div.column", h(ThemedColumn, { id: 495 })),
      ]),
    ]),
  );
}

function ThemedColumn({ id }: { id: number }) {
  const units = useColumnUnits(id);
  if (units == null) return h(Spinner);
  // Select a unit near the top so the overlay is visible without scrolling
  const selectedUnit = units[Math.min(2, units.length - 1)]?.unit_id ?? null;
  return h(Column, {
    units,
    selectedUnit,
    allowUnitSelection: true,
    showLabelColumn: false,
    width: 220,
    columnWidth: 140,
    targetUnitHeight: 12,
    t_age: 60,
    b_age: 160,
  });
}

const variableTable = Object.values(columnMapColorVariables)
  .map((spec) => {
    const chain = [...spec.fallbackVariables, `\`${spec.fallback}\``].join(
      " → ",
    );
    return `| \`${spec.variable}\` | ${chain} |`;
  })
  .join("\n");

export default {
  title: "Column views/Theming/Selection colors",
  component: ThemedColumnViews,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The column maps take their colors from CSS custom properties set on " +
          "the map's container (or any ancestor), read once when the map mounts; " +
          "`InsetMap` also accepts explicit `mapColors`. The column's unit " +
          "selection overlay uses `--selection-overlay-color` / " +
          "`--selection-overlay-opacity` the same way.\n\n" +
          "| Variable | Fallback chain |\n| --- | --- |\n" +
          variableTable +
          "\n| `--selection-overlay-color` | `red` |\n" +
          "| `--selection-overlay-opacity` | `0.5` |",
      },
    },
  },
  args: {
    columnColor: "#6b7280",
    hoverColor: "#d97706",
    selectionColor: "#2563eb",
    focusColor: "#dc2626",
    unitSelectionColor: "#2563eb",
    unitSelectionOpacity: 0.4,
  },
  argTypes: {
    columnColor: { control: "color" },
    hoverColor: { control: "color" },
    selectionColor: { control: "color" },
    focusColor: { control: "color" },
    unitSelectionColor: { control: "color" },
    unitSelectionOpacity: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
    },
  },
} as Meta<typeof ThemedColumnViews>;

export const SelectionColors = {};

export const LibraryDefaults = {
  args: {
    columnColor: "",
    hoverColor: "",
    selectionColor: "",
    focusColor: "",
    unitSelectionColor: "",
    unitSelectionOpacity: "",
  },
  parameters: {
    docs: {
      description: {
        story:
          "With every variable unset, each color falls back down its chain — " +
          "purple hover and selection, red focus, red unit overlay.",
      },
    },
  },
};
