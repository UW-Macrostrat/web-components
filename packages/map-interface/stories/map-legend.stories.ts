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
  DataField,
  IntervalTag,
  LithologyList,
} from "@macrostrat/data-components";
import { JSONView } from "@macrostrat/ui-components";
import {
  Button,
  NonIdealState,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useMemo, useEffect } from "react";
import { InfoDrawerHeader } from "../src/location-panel/header";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  MacrostratDataProvider,
  useMacrostratDefs,
} from "@macrostrat/data-provider";
import { loadable } from "jotai/utils";
import { LngLatBounds } from "mapbox-gl";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
const macrostratOverlay = buildMacrostratStyle({});

const defaultZoom = 8;

const legendAPIBase = "https://dev.macrostrat.org/api/v3/map/carto/legend";

// Story wrapper

function MapWithLegend(props: { bounds: BoundsArray; zoom?: number }) {
  const { bounds, zoom = defaultZoom } = props;
  const style = useBasicStylePair();

  const setMapPosition = useSetAtom(mapPositionAtom);

  const detailPanel = h(
    MacrostratDataProvider,
    { baseURL: "https://dev.macrostrat.org/api/v2" },
    h(LegendPanel, { zoom }),
  );

  useEffect(() => {
    setMapPosition({
      bounds: new LngLatBounds(bounds),
      zoom: 7, // Todo: estimate based on bounds
    });
  }, [bounds]);

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
      bounds: [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      enableTerrain: true,
      overlayStyles: [macrostratOverlay],
      onMapMoved(position, map) {
        setMapPosition({
          bounds: map.getBounds(),
          zoom: map.getZoom(),
        });
      },
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

// --- Jotai atoms for reactive state ---

type BoundsArray = [number, number, number, number];

interface MapViewPosition {
  bounds: LngLatBounds;
  zoom: number;
}

/** The current map viewport bounds, updated on map move */
const mapPositionAtom = atom<MapViewPosition | null>(null);

/** Legend data fetched from the API */

const legendDataAtom = atom(async (get, { signal }) => {
  const { bounds, zoom } = get(mapPositionAtom);
  if (bounds == null) return null;

  const boundsArray = bounds.toArray().flat() as [
    number,
    number,
    number,
    number,
  ];

  const params = new URLSearchParams({
    bounds: boundsArray.join(","),
    zoom: String(Math.round(zoom)),
  });

  const url = legendAPIBase + "?" + params.toString();

  const res = await fetch(url, { signal });
  const legendEntries = await res.json();

  return sortByAge(legendEntries);
});

function sortByAge(entries: any[]) {
  return entries.toSorted((a, b) => {
    return bestAge(a) - bestAge(b);
  });
}

function bestAge(unit): number {
  return (unit.t_age + unit.b_age) / 2;
}

const legendResultAtom = loadable(legendDataAtom);

enum LegendViewMode {
  PRETTY = "pretty",
  JSON = "json",
}

const viewModeAtom = atom(LegendViewMode.PRETTY);

/** The currently selected legend entry (shown in detail panel) */
const selectedEntryAtom = atom<any | null>(null);

/** Main legend sidebar panel */
function LegendPanel() {
  const selectedEntry = useAtomValue(selectedEntryAtom);

  if (selectedEntry != null) {
    return h(LegendDetailPanel, { entry: selectedEntry });
  }
  return h(LegendListPanel);
}

/** Panel showing the scrollable list of legend entries */
function LegendListPanel() {
  const res = useAtomValue(legendResultAtom);
  const { state, data } = res;
  const loading = state === "loading";

  const headerElement = h(InfoDrawerHeader, [h("h3", `Map Legend`)]);

  let content;
  if (data == null || loading) {
    content = h(NonIdealState, {
      icon: h(Spinner, { size: 24 }),
      title: "Loading legend data",
    });
  } else {
    content = h(LegendEntries, { data });
  }

  return h(
    LocationPanel,
    {
      headerElement,
      style: { flexShrink: 1 },
    },
    content,
  );
}

/** Detail panel for a single selected legend entry */
function LegendDetailPanel({ entry }: { entry: any }) {
  const setSelectedEntry = useSetAtom(selectedEntryAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  const headerElement = h(InfoDrawerHeader, {
    onClose: () => setSelectedEntry(null),
    children: h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
        },
      },
      [
        h(ColorSwatch, { color: entry.color }),
        h(
          "span",
          {
            style: {
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          },
          entry.map_unit_name ?? "Unknown unit",
        ),
        h("div.spacer"),
        h(JSONToggleButton, { viewMode, setViewMode }),
      ],
    ),
  });

  const content =
    viewMode === LegendViewMode.JSON
      ? h(JSONView, { data: entry, showRoot: false })
      : h(LegendEntryDetails, { entry });

  return h(
    LocationPanel,
    {
      headerElement,
      style: { flexShrink: 1 },
    },
    [
      h(
        "style",
        `.location-panel-header:hover .json-toggle-button { opacity: 1 !important; }`,
      ),
      content,
    ],
  );
}

/** Subtle JSON toggle button, shown on hover of the header */
function JSONToggleButton({
  viewMode,
  setViewMode,
}: {
  viewMode: LegendViewMode;
  setViewMode: (mode: LegendViewMode) => void;
}) {
  const isJSON = viewMode === LegendViewMode.JSON;
  return h(Button, {
    icon: "code",
    minimal: true,
    small: true,
    active: isJSON,
    title: isJSON ? "Show details" : "Show JSON",
    style: {
      opacity: isJSON ? 1 : 0,
      transition: "opacity 0.15s ease",
    },
    className: "json-toggle-button",
    onClick: (e) => {
      e.stopPropagation();
      setViewMode(isJSON ? LegendViewMode.PRETTY : LegendViewMode.JSON);
    },
  });
}

// --- Legend entry rendering ---

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

/** Resolve interval IDs to IntervalShort objects using the data provider */
function useResolvedIntervals(
  bIntervalId: number | null,
  tIntervalId: number | null,
) {
  const intervalMap = useMacrostratDefs("intervals");
  return useMemo(() => {
    if (intervalMap == null) return null;
    const intervals = [];
    if (bIntervalId != null) {
      const b = intervalMap.get(bIntervalId);
      if (b != null)
        intervals.push({
          id: b.int_id,
          name: b.int_name,
          b_age: b.b_age,
          t_age: b.t_age,
          color: b.color,
          rank: b.rank,
        });
    }
    if (tIntervalId != null && tIntervalId !== bIntervalId) {
      const t = intervalMap.get(tIntervalId);
      if (t != null)
        intervals.push({
          id: t.int_id,
          name: t.int_name,
          b_age: t.b_age,
          t_age: t.t_age,
          color: t.color,
          rank: t.rank,
        });
    }
    return intervals.length > 0 ? intervals : null;
  }, [intervalMap, bIntervalId, tIntervalId]);
}

/** Resolve lith_id array to lithology objects using the data provider */
function useResolvedLithologies(lithIds: number[] | null) {
  const lithMap = useMacrostratDefs("lithologies");
  return useMemo(() => {
    if (lithMap == null || lithIds == null || lithIds.length === 0) return null;
    const resolved = lithIds
      .map((id) => lithMap.get(id))
      .filter((d) => d != null)
      .map((d) => ({
        ...d,
        name: d.lith ?? d.name,
        color: d.color ?? "#888",
      }));
    return resolved.length > 0 ? resolved : null;
  }, [lithMap, lithIds]);
}

/** Clickable list item for a legend entry */
function LegendEntry({ entry }: { entry: any }) {
  const setSelectedEntry = useSetAtom(selectedEntryAtom);
  const { map_unit_name, color, age } = entry;

  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        cursor: "pointer",
        borderBottom: "1px solid var(--panel-rule-color, #eee)",
      },
      onClick: () => setSelectedEntry(entry),
    },
    [
      h(ColorSwatch, { color }),
      h(
        "span",
        { style: { fontWeight: 500, flex: 1 } },
        map_unit_name ?? "Unknown unit",
      ),
      h.if(age != null)(
        Tag,
        { minimal: true, style: { flexShrink: 0 } },
        age,
      ),
    ],
  );
}

/** Detailed view of a single legend entry (shown in the detail panel) */
function LegendEntryDetails({ entry }: { entry: any }) {
  const {
    map_unit_name,
    strat_name,
    age,
    lith,
    descrip,
    comments,
    color,
    b_age: bAge,
    t_age: tAge,
    b_interval,
    t_interval,
    lith_id,
    lith_classes,
    lith_types,
    area,
  } = entry;

  const resolvedIntervals = useResolvedIntervals(b_interval, t_interval);
  const resolvedLithologies = useResolvedLithologies(lith_id);

  // Fallback lithology types (unresolved) for when lith_id can't be resolved
  const fallbackLithologies = useMemo(() => {
    if (lith_types == null || lith_types.length === 0) return null;
    return lith_types.map((type: string, i: number) => ({
      name: type,
      color: "#888",
      lith_id: i,
    }));
  }, [lith_types]);

  const lithologies = resolvedLithologies ?? fallbackLithologies;

  return h("div", { style: { padding: "8px 10px" } }, [
    h.if(strat_name != null)(DataField, {
      label: "Stratigraphic name",
      value: strat_name,
    }),
    h.if(resolvedIntervals != null)(
      DataField,
      { label: "Intervals" },
      resolvedIntervals?.map((iv) =>
        h(IntervalTag, { key: iv.id, interval: iv, showAgeRange: true }),
      ),
    ),
    h.if(resolvedIntervals == null && bAge != null && tAge != null)(
      DataField,
      { label: "Age range", value: `${bAge} – ${tAge} Ma` },
    ),
    h.if(lith != null && lith !== "")(DataField, {
      label: "Lithology",
      value: lith,
    }),
    h.if(lithologies != null)(LithologyList, {
      label: "Matched lithologies",
      lithologies: lithologies ?? [],
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
  ]);
}

/** Pretty view of the full legend */
function LegendEntries({ data }: { data: any[] }) {
  if (data.length === 0) {
    return h("p.legend-empty", "No legend entries for this area.");
  }

  return h(
    "div.legend-entries",
    data.map((entry) => h(LegendEntry, { key: entry.legend_id, entry })),
  );
}
