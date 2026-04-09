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
  IntervalTag,
  LithologyList,
} from "@macrostrat/data-components";
import { JSONView } from "@macrostrat/ui-components";
import { Button, ButtonGroup, Spinner, Tag } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { useState, useMemo, useEffect } from "react";
import { InfoDrawerHeader } from "../src/location-panel/header";
import { useMapRef } from "@macrostrat/mapbox-react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import {
  MacrostratDataProvider,
  useMacrostratDefs,
} from "@macrostrat/data-provider";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
const macrostratOverlay = buildMacrostratStyle({});

const defaultZoom = 8;

const legendAPIBase = "https://dev.macrostrat.org/api/v3/map/carto/legend";

// --- Jotai atoms for reactive state ---

type Bounds = [number, number, number, number];

/** The current map viewport bounds, updated on map move */
const mapBoundsAtom = atom<Bounds | null>(null);

/** Legend data fetched from the API */
const legendDataAtom = atom<any[] | null>(null);

/** Whether a fetch is currently in progress */
const legendLoadingAtom = atom(false);

/** Hook to fetch legend data reactively when bounds change */
function useLegendFetcher(zoom: number) {
  const bounds = useAtomValue(mapBoundsAtom);
  const setData = useSetAtom(legendDataAtom);
  const setLoading = useSetAtom(legendLoadingAtom);

  useEffect(() => {
    if (bounds == null) return;
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      bounds: bounds.join(","),
      zoom: String(zoom),
    });

    fetch(`${legendAPIBase}?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch legend data:", err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bounds, zoom, setData, setLoading]);
}

/** Child component that syncs map viewport bounds to the Jotai atom */
function MapBoundsReporter() {
  const mapRef = useMapRef();
  const setBounds = useSetAtom(mapBoundsAtom);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;

    const update = () => {
      const b = map.getBounds();
      console.log("Map bounds", b);
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    };

    // Set initial bounds once loaded
    if (map.loaded()) {
      update();
    } else {
      map.once("load", update);
    }

    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
    };
  }, [mapRef.current]);

  return null;
}

// --- View mode ---

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
  return h(ButtonGroup, { minimal: true, className: "view-mode-toggle" }, [
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
  ]);
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

/** Pretty-rendered single legend entry */
function LegendEntry({ entry }: { entry: any }) {
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
        { minimal: true, style: { marginLeft: "auto" } },
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

/** Main legend sidebar panel */
function LegendPanel({ zoom = defaultZoom }: { zoom?: number }) {
  const [viewMode, setViewMode] = useState<LegendViewMode>(
    LegendViewMode.PRETTY,
  );

  // Fetch legend data reactively based on current map bounds
  useLegendFetcher(zoom);

  const data = useAtomValue(legendDataAtom);
  const loading = useAtomValue(legendLoadingAtom);

  const headerElement = h(InfoDrawerHeader, [
    h("h3", `Map Legend`),
    h(ViewModeToggle, { mode: viewMode, setMode: setViewMode }),
  ]);

  let content;
  if (data == null || loading) {
    content = h("div", { style: { padding: "2em", textAlign: "center" } }, [
      h(Spinner, { size: 24 }),
      h("p", loading ? "Loading legend…" : "Move the map to load legend data"),
    ]);
  } else if (viewMode === LegendViewMode.JSON) {
    content = h(JSONView, { data, showRoot: false });
  } else {
    content = h(LegendPrettyView, { data });
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

/** Story wrapper: map + fixed sidebar with reactive legend */
function MapWithLegend(props: { bounds: Bounds; zoom?: number }) {
  const { bounds, zoom = defaultZoom } = props;
  const style = useBasicStylePair();

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
    h(
      MapView,
      {
        style,
        mapboxToken,
        bounds: [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        overlayStyles: [macrostratOverlay],
        height: "100%",
        width: "100%",
      },
      [h(MapBoundsReporter)],
    ),
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
