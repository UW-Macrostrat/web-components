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
  IntervalField,
  LithologyList,
} from "@macrostrat/data-components";
import { JSONView } from "@macrostrat/ui-components";
import { Button, NonIdealState, Spinner, Tag } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useMemo } from "react";
import { InfoDrawerHeader } from "../src/location-panel/header";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  MacrostratDataProvider,
  useMacrostratDefs,
} from "@macrostrat/data-provider";
import { loadable } from "jotai/utils";
import { LngLatBounds } from "mapbox-gl";
import { useMapStyleOperator } from "@macrostrat/mapbox-react";

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

  return h(
    MapAreaContainer,
    {
      navbar: null,
      contextPanel: null,
      detailPanel,
      detailPanelStyle: DetailPanelStyle.FIXED,
    },
    [
      h(MapView, {
        style,
        mapboxToken,
        bounds,
        enableTerrain: true,
        overlayStyles: [macrostratOverlay],
        onMapMoved(position, map) {
          setMapPosition({
            bounds: map.getBounds(),
            zoom: map.getZoom(),
          });
        },
      }),
      h(MapSelectionManager),
    ],
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
  },
};

export const LowAltitudeOblique: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
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

  console.log("Fetching legend for bounds", bounds.toArray(), "zoom", zoom);
  const boundsArray = bounds.toArray().flat() as [
    number,
    number,
    number,
    number,
  ];

  const params = new URLSearchParams({
    bounds: boundsArray.join(","),
    zoom: String(Math.round(zoom + 4)),
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

const legendResultAtom = loadable<any>(legendDataAtom);

enum LegendViewMode {
  PRETTY = "pretty",
  JSON = "json",
}

const viewModeAtom = atom(LegendViewMode.PRETTY);

const selectedLegendIDsAtom = atom<Set<number> | null>();

const selectedEntryAtom = atom((get) => {
  const entries = get(legendResultAtom)?.data ?? [];
  const selectedIDs = get(selectedLegendIDsAtom);
  if (entries == null || selectedIDs == null || selectedIDs.size == 0)
    return null;
  return entries.find((e) => selectedIDs.has(e.legend_id)) ?? null;
});

function MapSelectionManager() {
  const [selectedLegendIDs, setSelectedLegendIDs] = useAtom(
    selectedLegendIDsAtom,
  );

  // Map style management
  useMapStyleOperator(
    (map) => {
      // First, remove previous selections
      if (selectedLegendIDs == null || selectedLegendIDs.size == 0) {
        map.setPaintProperty("burwell_fill", "fill-opacity", 0.5);
      } else {
        map.setPaintProperty("burwell_fill", "fill-opacity", [
          "case",
          [
            "in",
            ["get", "legend_id"],
            ["literal", Array.from(selectedLegendIDs)],
          ],
          0.8,
          0.1,
        ]);
      }
    },
    [selectedLegendIDs],
  );

  useMapStyleOperator((map) => {
    map.on("click", "burwell_fill", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["burwell_fill"],
      });
      if (features.length === 0) return;
      const feature = features[0];
      const legendId = feature.properties?.legend_id;
      if (legendId == null) return;
      console.log("Setting selected legend ID", legendId);
      setSelectedLegendIDs(new Set([legendId]));
    });
  });

  return null;
}

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
  const setSelectedLegendID = useSetAtom(selectedLegendIDsAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  const headerElement = h(InfoDrawerHeader, {
    onClose: () => setSelectedLegendID(null),
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
      marginRight: 10,
      verticalAlign: "middle",
      flexShrink: 0,
    },
  });
}

/** Resolve interval IDs to IntervalShort objects using the data provider */
function useResolvedIntervals(int_ids: number[]) {
  const intervalMap = useMacrostratDefs("intervals");
  return useMemo(() => {
    if (intervalMap == null) return [];
    return int_ids.map((d) => {
      const int = intervalMap.get(d);
      return { ...int, id: int.int_id };
    });
  }, [intervalMap, int_ids]);
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
  const setSelectedLegendIDs = useSetAtom(selectedLegendIDsAtom);
  const { map_unit_name, color, age } = entry;

  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        borderBottom: "1px solid var(--panel-rule-color, #eee)",
      },
      onClick: () => setSelectedLegendIDs(new Set([entry.legend_id])),
    },
    [
      h(ColorSwatch, { color }),
      h(
        "span",
        { style: { fontWeight: 500, flex: 1 } },
        map_unit_name ?? "Unknown unit",
      ),
      h.if(age != null)(Tag, { minimal: true, style: { flexShrink: 0 } }, age),
    ],
  );
}

/** Detailed view of a single legend entry (shown in the detail panel) */
function LegendEntryDetails({ entry }: { entry: any }) {
  const {
    strat_name,
    lith,
    descrip,
    comments,
    b_age,
    t_age,
    b_interval,
    t_interval,
    lith_id,
    lith_types,
  } = entry;

  const int_ids = [b_interval, t_interval].filter(Boolean);

  const resolvedIntervals = useResolvedIntervals(int_ids);
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

  return h("div", [
    h.if(strat_name != null)(DataField, {
      label: "Stratigraphic name",
      value: strat_name,
    }),
    h.if(resolvedIntervals != null)(IntervalField, {
      intervals: resolvedIntervals,
    }),
    h.if(b_age != null && t_age != null)(DataField, {
      label: "Age range",
      value: `${b_age}–${t_age}`,
      unit: "Ma",
    }),
    h.if(lith != null && lith !== "")(DataField, {
      label: "Lithology",
      value: lith,
    }),
    h.if(lithologies != null)(LithologyList, {
      label: "Matched lithologies",
      lithologies: lithologies ?? [],
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
