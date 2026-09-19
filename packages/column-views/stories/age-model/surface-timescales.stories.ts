/** The timescales a column's age model is actually calibrated against, drawn
 * beside the international one.
 *
 * Macrostrat's intervals belong to many timescales — the regional and custom
 * sets a compiler worked in — and a column's age model names whichever ones
 * its author used. Each of those is flat, so each is one more column of
 * intervals against the same section scales: the shared-scale arrangement
 * `@macrostrat/timescale` exposes, with the column's own scale rather than a
 * linear one. Showing the two or three a column leans on hardest says more
 * about how its ages were assigned than swapping a single column around. */
import { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Spinner, Tag } from "@blueprintjs/core";
import {
  MacrostratDataProvider,
  useMacrostratData,
} from "@macrostrat/data-provider";
import type { Interval } from "@macrostrat/timescale";
import type { UnitLong } from "@macrostrat/api-types";
import "@macrostrat/style-system";

import {
  ColoredUnitComponent,
  Column,
  ColumnSurfaces,
  type ColumnSurface,
  surfacesFromBoundaries,
  unitsAgeExtent,
  useColumnAgeModel,
  useTimescaleZoom,
} from "../../src";
import { useColumnBasicInfo, useColumnUnits } from "../column-ui/utils";
import { VerticalZoomControl, useVerticalZoom } from "./vertical-zoom";
import h from "./surface-timescales.stories.module.sass";

/** The international timescales the leveled columns already cover: the whole
 * set (11) and the single-rank cuts of it. Drawing one of these beside the
 * leveled timescale would just repeat one of its levels. */
const INTERNATIONAL_TIMESCALES = new Set([
  1, // ages
  2, // epochs
  3, // periods
  11, // intervals
  13, // eras
  14, // eons
  20, // intervals covering all time
]);

/** Clicking an interval zooms to it, and the international levels on show
 * follow the selection, so the levels aren't fixed here. */
const LEVEL_WINDOW = 3;

/** Macrostrat's international timescale, the one a column is leveled against */
const INTERNATIONAL_TIMESCALE_ID = 11;

interface SurfaceTimescalesProps {
  columnID: number;
  /** Name each timescale column above it */
  showTimescaleLabels?: boolean;
  /** How many of the column's referenced timescales to draw, most-used first */
  maxTimescales?: number;
  /** Draw only the selected surface's timescale, rather than the ranked set */
  followSelection?: boolean;
}

function SurfaceTimescalesUI(props: SurfaceTimescalesProps) {
  return h(MacrostratDataProvider, h(SurfaceTimescalesColumn, props));
}

function SurfaceTimescalesColumn(props: SurfaceTimescalesProps) {
  const {
    columnID,
    maxTimescales = 2,
    followSelection = false,
    showTimescaleLabels = false,
  } = props;

  const units = useColumnUnits(columnID) as any as UnitLong[] | null;
  const info = useColumnBasicInfo(columnID);
  const boundaries = useColumnAgeModel(columnID);
  const surfaces = useMemo(
    () => surfacesFromBoundaries(boundaries),
    [boundaries],
  );

  const verticalZoom = useVerticalZoom();
  const [selected, setSelected] = useState<ColumnSurface | null>(null);

  // What the view is anchored to: the interval a selected surface is
  // calibrated against, or one clicked directly in any of the timescale
  // columns. A click in a regional column is how you ask "what else is this
  // interval part of", so it has to count the same as a surface selection.
  const [anchor, setAnchor] = useState<AnchorInterval | null>(null);

  const { timescalesOf, ranked } = useColumnTimescales(surfaces, anchor?.id);

  const zoom = useTimescaleZoom({
    fullExtent: unitsAgeExtent(units),
    levelWindow: LEVEL_WINDOW,
  });

  const selectSurface = useCallback((surface: ColumnSurface | null) => {
    setSelected(surface);
    // A surface names an interval but not which timescale it was read from,
    // so the anchor's column is resolved from what ends up on screen
    setAnchor(surface?.calibration ?? null);
  }, []);

  const onClickTimescaleInterval = useCallback(
    (event: Event, data: { interval?: Interval; timescaleID?: number }) => {
      const interval = data?.interval;
      if (interval != null) {
        setAnchor({
          id: interval.int_id ?? interval.oid,
          name: interval.nam,
          // Which column it was clicked in: the same interval is drawn in
          // several of them, but only this one is the selection
          timescaleID: data.timescaleID,
        });
      }
      zoom.onClickTimescaleInterval(event, data as any);
    },
    [zoom.onClickTimescaleInterval],
  );

  // The timescales this column leans on hardest, plus whichever one the
  // anchoring interval pinned. Following the selection narrows that to the
  // pinned one alone.
  const [pinned, setPinned] = useState<ColumnTimescale | null>(null);

  const shown = useMemo(
    () => shownTimescales({ ranked, pinned, followSelection, maxTimescales }),
    [ranked, pinned, followSelection, maxTimescales],
  );

  const anchorIsShown = timescalesOf(anchor?.id).some((c) =>
    shown.some((d) => d.timescale_id === c.timescale_id),
  );

  // Pin a new timescale only when the ones on screen can't express the
  // anchoring interval. Most intervals belong to several timescales, so
  // re-deciding on every click swapped the column around for no visible
  // reason — clicking an interval that is already on screen should leave the
  // view where it is.
  useEffect(() => {
    if (anchor == null) return;
    const candidates = timescalesOf(anchor.id);
    // Nothing to pin: either the definition hasn't arrived yet, or the
    // interval is international-only. Either way, leave what's shown.
    if (candidates.length === 0) return;
    if (anchorIsShown) return;
    setPinned(bestRanked(candidates, ranked));
  }, [anchor, timescalesOf, ranked, anchorIsShown]);

  // The column the anchoring interval was picked in. A click says so outright;
  // a surface only names the interval, so take the drawn timescale that has
  // it, and fall back to the international one it is always leveled against.
  const anchorTimescaleID = useMemo(() => {
    if (anchor == null) return null;
    if (anchor.timescaleID != null) return anchor.timescaleID;
    const candidates = timescalesOf(anchor.id);
    const drawn = shown.find((d) =>
      candidates.some((c) => c.timescale_id === d.timescale_id),
    );
    return drawn?.timescale_id ?? INTERNATIONAL_TIMESCALE_ID;
  }, [anchor, timescalesOf, shown]);

  // Three tiers, because the same interval is drawn in every timescale that
  // contains it and only one of those is the selection: the anchor in its own
  // column is outlined, its counterparts elsewhere are left alone so they can
  // be read against it, and everything else recedes.
  const intervalStyle = useCallback(
    (interval: Interval, timescaleID: number) => {
      const style = zoom.timescaleIntervalStyle(interval);
      if (anchor == null) return style;

      const id = interval.int_id ?? interval.oid;
      if (id !== anchor.id) {
        return { ...style, ...UNRELATED_INTERVAL_STYLE };
      }
      if (timescaleID === anchorTimescaleID) {
        return { ...style, ...ANCHOR_INTERVAL_STYLE };
      }
      return style;
    },
    [anchor, anchorTimescaleID, zoom.timescaleIntervalStyle],
  );

  // Every timescale the column draws, the international one included: it is
  // the one that happens to be nested, not a separate kind of thing.
  const timescales = useMemo(
    () => [
      {
        id: INTERNATIONAL_TIMESCALE_ID,
        name: "International",
        levels: zoom.timescaleLevels,
      },
      ...shown.map((d) => ({ id: d.timescale_id, name: d.name })),
    ],
    [zoom.timescaleLevels, shown],
  );

  let labelPadding = 10;
  if (showTimescaleLabels) {
    labelPadding = 150;
  }

  if (units == null) {
    return h(Spinner);
  }

  return h("div.surface-timescales", [
    h("h2", info?.col_name ?? `Column ${columnID}`),
    h("div.story-controls", [
      h(TimescaleCaption, { shown, anchor, anchorIsShown, ranked, followSelection }),
      h(Button, {
        text: "Reset zoom",
        size: "small",
        disabled: zoom.isFullExtent,
        onClick() {
          zoom.reset();
        },
      }),
      h(VerticalZoomControl, { zoom: verticalZoom }),
    ]),
    h(
      Column,
      {
        units,
        unitComponent: ColoredUnitComponent,
        unconformityLabels: true,
        ...zoom.columnProps,
        timescales,
        showTimescaleLabels,
        timescaleIntervalStyle: intervalStyle,
        onClickTimescaleInterval,
        heightMultiplier: verticalZoom.heightMultiplier,
        columnWidth: 180,
        width: 350,
        // Room above the column for the timescale names
        paddingTop: labelPadding,
        windowPadding: 20,
      },
      h(ColumnSurfaces, {
        surfaces,
        labelWidth: 220,
        selectedSurface: selected?.id ?? null,
        onSelectSurface: selectSurface,
      }),
    ),
  ]);
}

/** An interval the view is anchored to, from a surface's calibration or a
 * click on a timescale. */
interface AnchorInterval {
  id: number;
  name?: string;
  /** The timescale it was picked in, when that is known */
  timescaleID?: number;
}

/** The first of `candidates` in ranked order — the column's own usage decides
 * which of an interval's timescales to show. One the column never uses is
 * still worth showing if that is what was clicked, so it falls through to the
 * first candidate. */
function bestRanked(
  candidates: ColumnTimescale[],
  ranked: ColumnTimescale[],
): ColumnTimescale | null {
  for (const entry of ranked) {
    if (candidates.some((d) => d.timescale_id === entry.timescale_id)) {
      return entry;
    }
  }
  return candidates[0] ?? null;
}

/** Which timescales to draw: the ranked set with the pinned one guaranteed a
 * place, or the pinned one alone when the view follows the selection. */
function shownTimescales(options: {
  ranked: ColumnTimescale[];
  pinned: ColumnTimescale | null;
  followSelection: boolean;
  maxTimescales: number;
}): ColumnTimescale[] {
  const { ranked, pinned, followSelection, maxTimescales } = options;
  if (followSelection) {
    const only = pinned ?? ranked[0] ?? null;
    if (only == null) return [];
    return [only];
  }
  return withTimescale(ranked.slice(0, maxTimescales), pinned, maxTimescales);
}

/** `shown` with `timescale` guaranteed a place, dropping the least-used one
 * to make room rather than widening the column. */
function withTimescale(
  shown: ColumnTimescale[],
  timescale: ColumnTimescale | null,
  max: number,
): ColumnTimescale[] {
  if (timescale == null) return shown;
  if (shown.some((d) => d.timescale_id === timescale.timescale_id)) {
    return shown;
  }
  return [...shown.slice(0, Math.max(max - 1, 0)), timescale];
}

/** How the anchoring interval is marked: the column's selection color, the
 * same outline a selected surface or unit gets. */
const UNRELATED_INTERVAL_STYLE = {
  opacity: 0.6,
};

const ANCHOR_INTERVAL_STYLE = {
  outline: "2px solid var(--column-selection-color)",
  outlineOffset: "-2px",
  fontWeight: "bold",
  zIndex: 1,
};

interface ColumnTimescale {
  timescale_id: number;
  name: string;
  /** How many of the column's calibration intervals belong to it */
  count: number;
}

/** The timescales a column's surfaces are calibrated in, ranked by how much
 * of the age model each covers, and a way to pick one for a given surface. */
function useColumnTimescales(
  surfaces: ColumnSurface[],
  anchorIntervalID?: number | null,
): {
  ranked: ColumnTimescale[];
  timescalesOf: (intervalID?: number | null) => ColumnTimescale[];
} {
  const calibrationIDs = useMemo(() => {
    const ids = new Set<number>();
    for (const surface of surfaces) {
      if (surface.calibration != null) ids.add(surface.calibration.id);
    }
    return Array.from(ids);
  }, [surfaces]);

  // An interval clicked in a timescale is usually, but not always, one the age
  // model calibrates against — ask for its definition too, or there is nothing
  // to say which timescales it belongs to.
  const intervalIDs = useMemo(() => {
    if (anchorIntervalID == null || calibrationIDs.includes(anchorIntervalID)) {
      return calibrationIDs;
    }
    return [...calibrationIDs, anchorIntervalID];
  }, [calibrationIDs, anchorIntervalID]);

  // `useMacrostratData` asks for these ids specifically, so definitions the
  // store hasn't seen are fetched
  const defs = useMacrostratData("intervals", intervalIDs, null);

  const timescalesByInterval = useMemo(() => {
    const map = new Map<number, ColumnTimescale[]>();
    for (const def of defs ?? []) {
      if (def == null) continue;
      const entries: ColumnTimescale[] = [];
      for (const { timescale_id, name } of def.timescales ?? []) {
        if (INTERNATIONAL_TIMESCALES.has(timescale_id)) continue;
        entries.push({ timescale_id, name, count: 0 });
      }
      map.set(def.int_id, entries);
    }
    return map;
  }, [defs]);

  const ranked = useMemo(() => {
    const counts = new Map<number, ColumnTimescale>();
    for (const id of calibrationIDs) {
      const entries = timescalesByInterval.get(id) ?? [];
      for (const entry of entries) {
        const existing = counts.get(entry.timescale_id);
        if (existing == null) {
          counts.set(entry.timescale_id, { ...entry, count: 1 });
        } else {
          existing.count += 1;
        }
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [timescalesByInterval, calibrationIDs]);

  /** The non-international timescales an interval belongs to. Which of them
   * it was "really" calibrated in is a guess — see `bestRanked`. */
  const timescalesOf = useCallback(
    (intervalID?: number | null) => {
      if (intervalID == null) return [];
      return timescalesByInterval.get(intervalID) ?? [];
    },
    [timescalesByInterval],
  );

  return { ranked, timescalesOf };
}

/** Which extra columns are showing, and why. */
function TimescaleCaption({
  shown,
  anchor,
  anchorIsShown,
  ranked,
  followSelection,
}: {
  shown: ColumnTimescale[];
  anchor: AnchorInterval | null;
  anchorIsShown: boolean;
  ranked: ColumnTimescale[];
  followSelection: boolean;
}) {
  const name = anchor?.name ?? "the selected interval";

  let explanation = `ranked by how much of the age model each covers, out of ${ranked.length} referenced`;
  if (followSelection) {
    explanation = "the timescale this column uses most";
  }
  if (anchor != null && anchorIsShown) {
    explanation = `${name} belongs to it`;
  } else if (anchor != null) {
    explanation = `${name} belongs to none of these, and to no other timescale on record`;
  }

  let content: any = h(
    "span.caption-text",
    "None of this column's calibration intervals belong to a regional timescale.",
  );
  if (shown.length > 0) {
    content = [
      ...shown.map((d) =>
        h(Tag, { key: d.timescale_id, variant: "minimal" }, d.name),
      ),
      h("span.caption-text", explanation),
    ];
  }

  return h("div.timescale-caption", [
    h("span.caption-label", "Referenced timescales:"),
    content,
    h(
      "span.caption-hint",
      "Select a surface, or click any interval, to anchor the view to it. " +
        "Clicking zooms; shift-click widens the window to the interval next door.",
    ),
  ]);
}

const meta: Meta<SurfaceTimescalesProps> = {
  title: "Column views/Age model/Referenced timescales",
  component: SurfaceTimescalesUI,
  args: {
    columnID: 432,
    maxTimescales: 2,
    followSelection: false,
    showTimescaleLabels: false,
  },
  argTypes: {
    columnID: { control: { type: "number" } },
    maxTimescales: { control: { type: "number" } },
    followSelection: { control: { type: "boolean" } },
    showTimescaleLabels: { control: { type: "boolean" } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A column's age model is calibrated against whatever intervals its " +
          "compiler used, and those belong to timescales besides the " +
          "international one — COSUNA, North American Regional, and so on. " +
          "Each is drawn as one more column against the same section scales " +
          "by `timescales`, so they can be read against each other " +
          "and against the units. Column 432 (Illinois) references eleven " +
          "timescales in all and works mostly in COSUNA.",
      },
      story: { inline: false, iframeHeight: 800 },
    },
  },
};
export default meta;

type Story = StoryObj<SurfaceTimescalesProps>;

/** The two timescales column 432 leans on hardest, beside the international
 * periods through ages. */
export const Primary: Story = {};

/** One column, following the selection: it shows whichever timescale the
 * selected surface was calibrated in. Narrower, but it can only answer for
 * one surface at a time. */
export const FollowSelection: Story = {
  args: { followSelection: true },
};

/** Everything the age model references. Column 432 names eleven timescales,
 * several of which are incidental — an interval belongs to every timescale it
 * appears in, so a global stage drags in the regional sets that adopted it. */
export const AllReferencedTimescales: Story = {
  args: { maxTimescales: 11, showTimescaleLabels: true },
};
