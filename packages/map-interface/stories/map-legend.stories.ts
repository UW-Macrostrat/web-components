import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DetailPanelStyle,
  LocationPanel,
  MapAreaContainer,
  MapView,
  useBasicStylePair,
} from "../src";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import {
  ExpansionPanel,
  DataField,
  LithologyList,
} from "@macrostrat/data-components";
import { useAPIResult } from "@macrostrat/ui-components";
import { Button, ButtonGroup, Spinner, Tag } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useState, useMemo } from "react";
import { InfoDrawerHeader } from "../src/location-panel/header";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
const macrostratOverlay = buildMacrostratStyle({});

// Default bounds for South Dakota area
const defaultBounds: [number, number, number, number] = [-100, 43, -98, 44];
const defaultZoom = 8;

const legendAPIBase = "https://dev.macrostrat.org/api/v3/map/carto/legend";

function useLegendData(bounds: [number, number, number, number], zoom: number) {
  return useAPIResult(
    legendAPIBase,
    {
      bounds: bounds.join(","),
      zoom,
    },
    (res) => res,
  );
}

enum LegendViewMode {
  PRETTY = "pretty",
  JSON = "json",
}

/** Toggle between JSON and pretty view */
function ViewModeToggle({
  mode,
  setMode,
}: {
  mode: LegendViewMode;
  setMode: (m: LegendViewMode) => void;
}) {
  return h(
    ButtonGroup,
    { minimal: true, small: true, className: "view-mode-toggle" },
    [
      h(Button, {
        text: "Legend",
        active: mode === LegendViewMode.PRETTY,
        onClick: () => setMode(LegendViewMode.PRETTY),
        icon: "list",
      }),
      h(Button, {
        text: "JSON",
        active: mode === LegendViewMode.JSON,
        onClick: () => setMode(LegendViewMode.JSON),
        icon: "code",
      }),
    ],
  );
}

/** Color swatch for a legend entry */
function ColorSwatch({ color }: { color: string | null }) {
  if (color == null || color === "") return null;
  return h("span", {
    style: {
      display: "inline-block",
      width: 16,
      height: 16,
      backgroundColor: color,
      border: "1px solid rgba(0,0,0,0.2)",
      borderRadius: 2,
      marginRight: 6,
      verticalAlign: "middle",
      flexShrink: 0,
    },
  });
}

/** Pretty-rendered single legend entry */
function LegendEntry({ entry }: { entry: any }) {
  const {
    legend_id,
    map_unit_name,
    strat_name,
    age,
    lith,
    descrip,
    comments,
    color,
    b_age: bAge,
    t_age: tAge,
    lith_classes,
    lith_types,
    area,
  } = entry;

  // Build lithology tags for display
  const lithologies = useMemo(() => {
    if (lith_types == null || lith_types.length === 0) return null;
    return lith_types.map((type: string, i: number) => ({
      name: type,
      color: "#888",
      lith_id: i,
    }));
  }, [lith_types]);

  const headerElement = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
      },
    },
    [
      h(ColorSwatch, { color }),
      h(
        "span",
        { style: { fontWeight: 500 } },
        map_unit_name ?? "Unknown unit",
      ),
      h.if(age != null)(
        Tag,
        { minimal: true, small: true, style: { marginLeft: "auto" } },
        age,
      ),
    ],
  );

  return h(
    ExpansionPanel,
    {
      title: null,
      sideComponent: headerElement,
      expanded: false,
    },
    [
      h.if(strat_name != null)(DataField, {
        label: "Stratigraphic name",
        value: strat_name,
      }),
      h.if(bAge != null && tAge != null)(DataField, {
        label: "Age range",
        value: `${bAge} – ${tAge} Ma`,
      }),
      h.if(lith != null && lith !== "")(DataField, {
        label: "Lithology",
        value: lith,
      }),
      h.if(lithologies != null)(LithologyList, {
        label: "Lithology types",
        lithologies: lithologies ?? [],
      }),
      h.if(lith_classes != null && lith_classes.length > 0)(DataField, {
        label: "Lithology classes",
        value: lith_classes?.join(", "),
      }),
      h.if(area != null)(DataField, {
        label: "Area",
        value: `${Math.round(area)} km²`,
      }),
      h.if(descrip != null)(DataField, {
        label: "Description",
        value: descrip,
      }),
      h.if(comments != null)(DataField, { label: "Comments", value: comments }),
    ],
  );
}

/** Pretty view of the full legend */
function LegendPrettyView({ data }: { data: any[] }) {
  if (data.length === 0) {
    return h("p.legend-empty", "No legend entries for this area.");
  }

  // Sort by area descending so the most prominent units appear first
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
  }, [data]);

  return h(
    "div.legend-entries",
    sorted.map((entry) => h(LegendEntry, { key: entry.legend_id, entry })),
  );
}

/** JSON view of the legend data */
function LegendJSONView({ data }: { data: any[] }) {
  return h(
    "pre",
    {
      style: {
        fontSize: 11,
        lineHeight: 1.4,
        margin: 0,
        padding: "0.5em",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },
    },
    JSON.stringify(data, null, 2),
  );
}

/** Main legend sidebar panel */
function LegendPanel({
  bounds,
  zoom = defaultZoom,
  onClose,
}: {
  bounds: [number, number, number, number];
  zoom?: number;
  onClose?: () => void;
}) {
  const [viewMode, setViewMode] = useState<LegendViewMode>(
    LegendViewMode.PRETTY,
  );
  const data = useLegendData(bounds, zoom);

  const headerElement = h(InfoDrawerHeader, [
    h("h3", `Map Legend`),
    h(ViewModeToggle, { mode: viewMode, setMode: setViewMode }),
  ]);

  const content =
    data == null
      ? h("div", { style: { padding: "2em", textAlign: "center" } }, [
          h(Spinner, { size: 24 }),
          h("p", "Loading legend…"),
        ])
      : viewMode === LegendViewMode.PRETTY
        ? h(LegendPrettyView, { data })
        : h(LegendJSONView, { data });

  return h(
    LocationPanel,
    {
      headerElement,
      style: { flexShrink: 1 },
    },
    content,
  );
}

/** Story wrapper: map + fixed sidebar */
function MapWithLegend(props: {
  bounds: [number, number, number, number];
  zoom?: number;
}) {
  const { bounds, zoom = defaultZoom } = props;
  const style = useBasicStylePair();

  const detailPanel = h(LegendPanel, {
    bounds,
    zoom,
    onClose: null,
  });

  return h(
    MapAreaContainer,
    {
      navbar: null,
      contextPanel: null,
      detailPanel,
      detailPanelStyle: DetailPanelStyle.FIXED,
    },
    h(MapView, {
      style,
      mapboxToken,
      position: null,
      bounds: [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      overlayStyles: [macrostratOverlay],
    }),
  );
}

// --- Storybook meta ---

const meta: Meta<typeof MapWithLegend> = {
  title: "Map interface/Map legend",
  component: MapWithLegend,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 600,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MapWithLegend>;

export const SouthDakota: Story = {
  args: {
    bounds: [-100, 43, -98, 44],
    zoom: 8,
  },
};

export const Utah: Story = {
  args: {
    bounds: [-112, 38, -110, 40],
    zoom: 7,
  },
};

export const Appalachia: Story = {
  args: {
    bounds: [-82, 36, -79, 38],
    zoom: 8,
  },
};
