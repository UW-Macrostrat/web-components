/** The surfaces view wired for navigation: a column-selection map beside the
 * column, and a modal selection mode — units or surfaces — that the arrow
 * keys drive. No legend here; the focus is on moving around. */
import { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, SegmentedControl, Spinner } from "@blueprintjs/core";
import { useKeyHandler } from "@macrostrat/ui-components";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import { ColumnAxisType } from "@macrostrat/column-components";
import type { UnitLong } from "@macrostrat/api-types";
import type { Interval, TimescaleClickData } from "@macrostrat/timescale";
import "@macrostrat/style-system";

import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  ColumnSurfaces,
  type AgeWindow,
  type ColumnSurface,
  type SurfaceLinesExtent,
  type SurfaceStatus,
  SurfaceDetailsPanel,
  UnitDetailsPanel,
  compareAlongAxis,
  surfaceStatuses,
  surfacesFromBoundaries,
  surfacesFromUnits,
  useAnimatedAgeWindow,
  useColumnAgeModel,
} from "../../src";
import {
  useColumnBasicInfo,
  useColumnSelection,
  useColumnUnits,
} from "../column-ui/utils";
import h from "./surface-navigation.stories.module.sass";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

/** Which kind of object the selection and the arrow keys address */
type SelectionMode = "units" | "surfaces";

interface SurfaceNavigationProps {
  columnID: number;
  setColumn: (columnID: number) => void;
  projectID?: number;
  /** The mode the story starts in; it is switched from the UI thereafter */
  selectionMode?: SelectionMode;
  /** Show a timescale that zooms the rendered age window on click */
  zoomableTimescale?: boolean;
  /** Px of the abutting sections revealed past a zoomed window, so
   * neighboring intervals stay clickable */
  windowPadding?: number;
  extent?: SurfaceLinesExtent;
  showLines?: boolean;
  showLabels?: boolean;
  /** Only show surfaces with these statuses */
  statusFilter?: SurfaceStatus[] | null;
  /** Which surfaces are labeled; `null` labels them all */
  labelStatuses?: SurfaceStatus[] | null;
  /** Promote `modeled` surfaces that must in fact constrain the age model to
   * `relative` — see `inferTiePointStatuses` */
  inferTiePoints?: boolean;
}

/** Column and its surfaces on the left; map, mode switch and inspector on
 * the right. */
function SurfaceNavigationUI(props: SurfaceNavigationProps) {
  // The column data is fetched inside the provider, so the story follows
  // whichever API Storybook is pointed at
  return h(MacrostratDataProvider, h(SurfaceNavigation, props));
}

function SurfaceNavigation(props: SurfaceNavigationProps) {
  const {
    columnID,
    setColumn,
    projectID,
    selectionMode = "surfaces",
    zoomableTimescale = true,
    windowPadding = 20,
    extent,
    showLines,
    showLabels,
    statusFilter,
    labelStatuses,
    inferTiePoints = true,
  } = props;

  const units = useColumnUnits(columnID) as any as UnitLong[] | null;
  const info = useColumnBasicInfo(columnID);
  const zoom = useTimescaleZoom(units, zoomableTimescale);
  // Resolved here rather than inside `ColumnSurfaces`, so the mode switch and
  // the keyboard handler address exactly the surfaces that are drawn — which,
  // zoomed in, is only the surfaces the window still shows
  const surfaces = useColumnSurfaceList(columnID, units, zoom.window, {
    statuses: statusFilter,
    inferTiePoints,
  });

  const [mode, setMode] = useState<SelectionMode>(selectionMode);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ColumnSurface | null>(
    null,
  );

  // The column's selection manager calls `onUnitSelected` whenever its own
  // state settles, echoing selections we made ourselves. Tracking the unit in
  // a ref lets us tell a real click from an echo, so an echo can't pull the
  // mode back to units under a surface selection.
  const selectedUnitRef = useRef<number | null>(null);
  const setUnitSelection = useCallback((unitID: number | null) => {
    selectedUnitRef.current = unitID;
    setSelectedUnit(unitID);
  }, []);

  // A selection belongs to the column it was made in
  useEffect(() => {
    setUnitSelection(null);
    setSelectedSurface(null);
    zoom.reset();
  }, [columnID, setUnitSelection]);

  useEffect(() => {
    setMode(selectionMode);
  }, [selectionMode]);

  const selectUnit = useCallback(
    (unitID: number | null) => {
      if (unitID === selectedUnitRef.current) return;
      setUnitSelection(unitID);
      if (unitID == null) return;
      // Clicking either kind of object switches the mode to match it
      setMode("units");
      setSelectedSurface(null);
    },
    [setUnitSelection],
  );

  const selectSurface = useCallback(
    (surface: ColumnSurface | null) => {
      setSelectedSurface(surface);
      if (surface == null) return;
      setMode("surfaces");
      setUnitSelection(null);
    },
    [setUnitSelection],
  );

  /** Switch modes, carrying the selection over to the adjacent object: a
   * unit hands off to the surface at its base, and a surface to the unit
   * above it — so switching back and forth stays put. */
  const switchMode = useCallback(
    (next: SelectionMode) => {
      if (next === mode) return;
      setMode(next);
      if (next === "surfaces") {
        const unit = units?.find((d) => d.unit_id === selectedUnit) ?? null;
        setUnitSelection(null);
        setSelectedSurface(basalSurface(unit, surfaces));
        return;
      }
      const unit = overlyingUnit(selectedSurface, units);
      setSelectedSurface(null);
      setUnitSelection(unit?.unit_id ?? null);
    },
    [mode, units, surfaces, selectedUnit, selectedSurface, setUnitSelection],
  );

  const clearSelection = useCallback(() => {
    setUnitSelection(null);
    setSelectedSurface(null);
  }, [setUnitSelection]);

  useModeKeys(switchMode, clearSelection);

  return h("div.surface-navigation", [
    h("div.column-pane", [
      h(ColumnPane, {
        columnID,
        units,
        surfaces,
        zoom,
        windowPadding,
        columnName: info?.col_name,
        mode,
        selectedUnit,
        onSelectUnit: selectUnit,
        selectedSurface,
        onSelectSurface: selectSurface,
        extent,
        showLines,
        showLabels,
        labelStatuses,
      }),
    ]),
    h("div.side-pane", [
      h(ColumnNavigationMap, {
        projectID,
        accessToken: mapboxToken,
        selectedColumn: columnID,
        onSelectColumn: setColumn,
        className: "column-selector-map",
      }),
      h.if(zoom.enabled)(ZoomControls, { zoom }),
      h(SegmentedControl, {
        fill: true,
        small: true,
        options: [
          { label: "Units", value: "units" },
          { label: "Surfaces", value: "surfaces" },
        ],
        value: mode,
        onValueChange: (value) => switchMode(value as SelectionMode),
        className: "mode-selector",
      }),
      h(DetailsPane, {
        mode,
        units,
        selectedUnit,
        onSelectUnit: selectUnit,
        selectedSurface,
        onSelectSurface: selectSurface,
      }),
    ]),
  ]);
}

interface ColumnPaneProps {
  columnID: number;
  units: UnitLong[] | null;
  surfaces: ColumnSurface[];
  zoom: TimescaleZoom;
  windowPadding?: number;
  columnName?: string;
  mode: SelectionMode;
  selectedUnit: number | null;
  onSelectUnit: (unitID: number | null) => void;
  selectedSurface: ColumnSurface | null;
  onSelectSurface: (surface: ColumnSurface | null) => void;
  extent?: SurfaceLinesExtent;
  showLines?: boolean;
  showLabels?: boolean;
  labelStatuses?: SurfaceStatus[] | null;
}

function ColumnPane(props: ColumnPaneProps) {
  const {
    columnID,
    units,
    surfaces,
    zoom,
    windowPadding,
    columnName,
    mode,
    selectedUnit,
    onSelectUnit,
    selectedSurface,
    onSelectSurface,
    extent,
    showLines,
    showLabels,
    labelStatuses,
  } = props;

  if (units == null) {
    return h(Spinner);
  }

  return h([
    h("h2", columnName ?? `Column ${columnID}`),
    h(
      Column,
      {
        units,
        unitComponent: ColoredUnitComponent,
        unconformityLabels: true,
        allowUnitSelection: true,
        keyboardNavigation: mode === "units",
        selectedUnit,
        onUnitSelected: onSelectUnit,
        columnWidth: 250,
        width: 400,
        // Zooming changes only the rendered age window; see the
        // "Interval zoom" story for the mechanics
        ...zoom.columnProps,
        windowPadding,
      },
      h(ColumnSurfaces, {
        surfaces,
        extent,
        showLines,
        showLabels,
        labelStatuses,
        selectedSurface: selectedSurface?.id ?? null,
        onSelectSurface,
      }),
    ),
    h.if(mode === "surfaces")(SurfaceKeyboardNavigation, {
      surfaces,
      selectedSurface,
      onSelectSurface,
    }),
  ]);
}

/** Up and down move the selection through the surfaces, from the top of the
 * column downwards. With nothing selected, the first key press enters from
 * the end it came from. While this is mounted the arrow keys belong to the
 * surfaces: at the ends of the column the selection simply stays put, rather
 * than the key falling through to anything else. */
function SurfaceKeyboardNavigation({
  surfaces,
  selectedSurface,
  onSelectSurface,
}: {
  surfaces: ColumnSurface[];
  selectedSurface: ColumnSurface | null;
  onSelectSurface: (surface: ColumnSurface | null) => void;
}) {
  useKeyHandler(
    (event) => {
      let delta = 0;
      if (event.key === "ArrowUp") delta = -1;
      if (event.key === "ArrowDown") delta = 1;
      if (delta === 0) return;
      // Claim the key even when the selection can't move
      event.preventDefault();
      event.stopPropagation();
      if (surfaces.length === 0) return;

      const ix = surfaces.findIndex((d) => d.id === selectedSurface?.id);
      let next: ColumnSurface | null = null;
      if (ix === -1) {
        if (delta === 1) {
          next = surfaces[0];
        } else {
          next = surfaces[surfaces.length - 1];
        }
      } else {
        next = surfaces[ix + delta] ?? null;
      }
      if (next == null) return;
      onSelectSurface(next);
    },
    [surfaces, selectedSurface, onSelectSurface],
  );
  return null;
}

interface DetailsPaneProps {
  mode: SelectionMode;
  units: UnitLong[] | null;
  selectedUnit: number | null;
  onSelectUnit: (unitID: number | null) => void;
  selectedSurface: ColumnSurface | null;
  onSelectSurface: (surface: ColumnSurface | null) => void;
}

/** The inspector for whichever kind of object the current mode addresses. */
function DetailsPane(props: DetailsPaneProps) {
  const {
    mode,
    units,
    selectedUnit,
    onSelectUnit,
    selectedSurface,
    onSelectSurface,
  } = props;

  if (mode === "surfaces") {
    if (selectedSurface == null) {
      return h("p.placeholder", "Select a surface — a line or a label.");
    }
    return h(SurfaceDetailsPanel, {
      surface: selectedSurface,
      onClose: () => onSelectSurface(null),
      onSelectUnit,
    });
  }

  const unit = units?.find((d) => d.unit_id === selectedUnit);
  if (unit == null) {
    return h("p.placeholder", "Select a unit.");
  }
  return h(UnitDetailsPanel, {
    unit,
    onClose: () => onSelectUnit(null),
    onSelectUnit,
  });
}

/** `u` and `s` switch modes; `escape` clears the selection. */
function useModeKeys(
  switchMode: (mode: SelectionMode) => void,
  clearSelection: () => void,
) {
  useKeyHandler(
    (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "u") switchMode("units");
      if (event.key === "s") switchMode("surfaces");
      if (event.key === "Escape") clearSelection();
    },
    [switchMode, clearSelection],
  );
}

/** Deepest timescale level to show (age/stage) */
const MAX_TIMESCALE_LEVEL = 5;
/** Coarsest level worth showing; level 0 is "all of geologic time" */
const MIN_TIMESCALE_LEVEL = 1;
/** How many levels the timescale shows at once */
const LEVEL_WINDOW = 3;
/** The level to anchor on before anything is picked. 3 (period) puts the
 * starting window at era–epoch, the same levels a `Column` shows by default;
 * drilling from there slides it down to period–age. */
const DEFAULT_SELECTED_LEVEL = 3;

interface TimescaleZoom {
  enabled: boolean;
  /** The rendered age window, or `null` when zooming is off or the extent
   * isn't known yet */
  window: AgeWindow | null;
  selectedInterval: Interval | null;
  isFullExtent: boolean;
  reset(): void;
  /** Timescale and age-window props to spread onto the `Column` */
  columnProps: Record<string, any>;
}

/** Click-to-zoom over geologic time, in the compact form this story needs:
 * clicking an interval zooms the rendered window to it, clicking the interval
 * you are already in zooms back out a level, and the timescale shows a
 * three-level window that follows the selection. The full treatment — drill
 * paths across parents, padding, density — is the "Interval zoom" story. */
function useTimescaleZoom(
  units: UnitLong[] | null,
  enabled: boolean,
): TimescaleZoom {
  const fullExtent = useMemo<AgeWindow | null>(() => {
    if (units == null || units.length === 0) return null;
    return {
      t_age: Math.min(...units.map((d) => d.t_age)),
      b_age: Math.max(...units.map((d) => d.b_age)),
    };
  }, [units]);

  const anim = useAnimatedAgeWindow({ fullExtent });
  // The intervals drilled through; the last one is the current selection
  const [stack, setStack] = useState<Interval[]>([]);
  const selectedInterval = stack[stack.length - 1] ?? null;

  const reset = useCallback(() => {
    setStack([]);
    anim.reset();
  }, [anim.reset]);

  const onClickTimescaleInterval = useCallback(
    (_evt: Event, data: TimescaleClickData) => {
      const interval = data?.interval;
      if (interval == null || interval.lvl == null) return;

      // Clicking the interval you are in is how you zoom out
      if (interval.oid === selectedInterval?.oid) {
        const next = stack.slice(0, -1);
        setStack(next);
        const parent = next[next.length - 1] ?? null;
        if (parent == null) {
          anim.reset();
        } else {
          anim.zoomToInterval(parent);
        }
        return;
      }

      // Anything else navigates to the interval clicked, keeping only the
      // coarser intervals that actually contain it
      const containing = stack.filter(
        (d) =>
          d.lvl < interval.lvl &&
          d.eag >= interval.eag &&
          d.lag <= interval.lag,
      );
      setStack([...containing, interval]);
      anim.zoomToInterval(interval);
    },
    [stack, selectedInterval, anim.reset, anim.zoomToInterval],
  );

  // Bold the selected interval — the one whose click zooms out
  const intervalStyle = useCallback(
    (interval: Interval) => {
      if (interval.oid === selectedInterval?.oid) {
        return { fontWeight: "bold" };
      }
      return {};
    },
    [selectedInterval],
  );

  if (!enabled) {
    return {
      enabled: false,
      window: null,
      selectedInterval: null,
      isFullExtent: true,
      reset: noop,
      columnProps: {},
    };
  }

  const window = anim.window ?? fullExtent;
  const level = selectedInterval?.lvl ?? DEFAULT_SELECTED_LEVEL;

  return {
    enabled: true,
    window,
    selectedInterval,
    isFullExtent: anim.isFullExtent,
    reset,
    columnProps: {
      showTimescale: true,
      timescaleLevels: timescaleLevels(level),
      timescaleIntervalStyle: intervalStyle,
      onClickTimescaleInterval,
      t_age: window?.t_age,
      b_age: window?.b_age,
      isTransitioning: anim.isAnimating,
    },
  };
}

/** A fixed window of timescale levels that slides with the selected level —
 * one coarser for context, one finer to drill into. */
function timescaleLevels(selectedLevel: number): [number, number] {
  const lo = Math.min(
    Math.max(selectedLevel - 1, MIN_TIMESCALE_LEVEL),
    MAX_TIMESCALE_LEVEL - (LEVEL_WINDOW - 1),
  );
  return [lo, lo + (LEVEL_WINDOW - 1)];
}

/** The rendered window, and a way back out to the whole column. */
function ZoomControls({ zoom }: { zoom: TimescaleZoom }) {
  const { window, selectedInterval, isFullExtent } = zoom;

  let range: string = "Full column";
  if (window != null && !isFullExtent) {
    range = `${window.t_age.toFixed(1)}–${window.b_age.toFixed(1)} Ma`;
  }

  return h("div.zoom-controls", [
    h("div.zoom-range", [
      h("span.interval-name", selectedInterval?.nam ?? "Full column"),
      h("code", range),
    ]),
    h(
      Button,
      {
        size: "small",
        variant: "minimal",
        icon: "zoom-to-fit",
        disabled: isFullExtent,
        onClick: zoom.reset,
      },
      "Reset zoom",
    ),
    h(
      "p.hint",
      "Click a timescale interval to zoom to it; click the bold one to zoom back out.",
    ),
  ]);
}

function noop() {}

/** The column's surfaces — its age model, or surfaces derived from unit tops
 * and bottoms when it has none — filtered to the statuses on show and
 * ordered from the top of the column downwards. */
function useColumnSurfaceList(
  columnID: number,
  units: UnitLong[] | null,
  window: AgeWindow | null,
  options: {
    statuses?: SurfaceStatus[] | null;
    inferTiePoints?: boolean;
  },
): ColumnSurface[] {
  const { statuses, inferTiePoints } = options;
  const boundaries = useColumnAgeModel(columnID);

  return useMemo(() => {
    let surfaces = surfacesFromBoundaries(boundaries, { inferTiePoints });
    if (surfaces.length === 0) {
      surfaces = surfacesFromUnits(units, { axisType: AXIS_TYPE });
    }
    if (statuses != null) {
      const allowed = new Set(statuses);
      surfaces = surfaces.filter((d) => allowed.has(d.status));
    }
    if (window != null) {
      // A surface outside the rendered window has no position on the scale
      // and isn't drawn, so it shouldn't be navigable either
      surfaces = surfaces.filter(
        (d) => d.age >= window.t_age && d.age <= window.b_age,
      );
    }
    return [...surfaces].sort((a, b) => compareAlongAxis(a, b, AXIS_TYPE));
  }, [
    boundaries,
    units,
    statuses,
    inferTiePoints,
    window?.t_age,
    window?.b_age,
  ]);
}

/** This story renders an age column; the handoffs below are along that axis. */
const AXIS_TYPE = ColumnAxisType.AGE;

/** The surface at a unit's base — the one the unit sits on. Surfaces record
 * the units above and below them, so the unit's basal surface is the one
 * listing it above; failing that (a status filter can hide it), the surface
 * closest to the unit's base. */
function basalSurface(
  unit: UnitLong | null,
  surfaces: ColumnSurface[],
): ColumnSurface | null {
  if (unit == null || surfaces.length === 0) return null;

  // Prefer the surface this unit heads, so the round trip returns to it
  const heads = surfaces.find((d) => d.unitsAbove[0] === unit.unit_id);
  if (heads != null) return heads;

  const listed = surfaces.find((d) => d.unitsAbove.includes(unit.unit_id));
  if (listed != null) return listed;

  return nearest(surfaces, (d) => Math.abs(d.age - unit.b_age));
}

/** The unit above a surface — the one it underlies. */
function overlyingUnit(
  surface: ColumnSurface | null,
  units: UnitLong[] | null,
): UnitLong | null {
  if (surface == null || units == null || units.length === 0) return null;

  for (const unitID of [...surface.unitsAbove, ...surface.unitsBelow]) {
    const unit = units.find((d) => d.unit_id === unitID);
    if (unit != null) return unit;
  }

  // No recorded neighbors: the unit whose base is closest to the surface
  return nearest(units, (d) => Math.abs(d.b_age - surface.age));
}

function nearest<T>(items: T[], distance: (item: T) => number): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;
  for (const item of items) {
    const d = distance(item);
    if (Number.isNaN(d) || d >= bestDistance) continue;
    best = item;
    bestDistance = d;
  }
  return best;
}

function Template(args: SurfaceNavigationProps) {
  const { columnID, setColumn } = useColumnSelection();
  return h(SurfaceNavigationUI, { ...args, columnID, setColumn });
}

const meta: Meta<SurfaceNavigationProps> = {
  title: "Column views/Age model/Surface navigation",
  component: SurfaceNavigationUI,
  render: Template,
  args: {
    columnID: 432,
    projectID: 1,
    selectionMode: "surfaces",
    zoomableTimescale: true,
    windowPadding: 20,
    inferTiePoints: true,
    showLines: true,
    showLabels: true,
    extent: "units",
  },
  argTypes: {
    columnID: { control: { type: "number" } },
    projectID: { control: { type: "number" } },
    selectionMode: {
      options: ["units", "surfaces"],
      control: { type: "radio" },
    },
    zoomableTimescale: { control: { type: "boolean" } },
    inferTiePoints: {
      control: { type: "boolean" },
      description:
        "Promote `modeled` surfaces that can't have been interpolated — on an interval bound, or at the edge of a gap-bound package — to `relative`; a client-side stand-in for statuses the data doesn't record precisely yet",
    },
    windowPadding: {
      control: { type: "number" },
      description:
        "Px of the abutting sections revealed past a zoomed window, so neighboring intervals stay clickable",
    },
    extent: { options: ["units", "column"], control: { type: "radio" } },
    statusFilter: { options: surfaceStatuses, control: { type: "check" } },
    labelStatuses: { options: surfaceStatuses, control: { type: "check" } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "The age-model surfaces view with navigation attached. The map picks the " +
          "column — the same `ColumnNavigationMap` the column-navigation stories " +
          "use — and selection is modal: in *units* mode the arrow keys walk the " +
          "unit boxes, in *surfaces* mode they walk the surfaces from the top of " +
          "the column downwards. Switching modes hands the selection to the " +
          "adjacent object — a unit to the surface at its base, that surface back " +
          "to the unit above it — so switching back and forth stays put. Clicking " +
          "the other kind of object switches modes too. The inspector follows the " +
          "mode, and there is no status legend. The timescale zooms: click an " +
          "interval to narrow the rendered age window to it, the bold one to " +
          "zoom back out. Surfaces outside the window are neither drawn nor " +
          "navigable, so the keyboard walks what you are looking at.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<SurfaceNavigationProps>;

/** Surfaces mode: the arrow keys walk the age-model surfaces. */
export const Primary: Story = {};

/** Units mode: the arrow keys walk the unit boxes, with the surfaces drawn
 * as context. */
export const UnitSelection: Story = {
  args: { selectionMode: "units" },
};

/** Only the surfaces that carry independent age information, so the keyboard
 * steps between tie points rather than every modeled surface.
 *
 * `boundary_status` under-reports the tie points: surfaces that can't have
 * been interpolated — pinned to an interval's base or top, or forming the edge
 * of a gap-bound package — are carried as `modeled` in the data today, when
 * conceptually they are `relative`. `inferTiePoints` (on by default) promotes
 * those client-side, so they survive this filter; their status tag is marked
 * as inferred. Turn it off to see what the data alone says. A mid-interval
 * position is left alone (an assigned position and an interpolated one are the
 * same record there), as is an open side in a section's interior, which marks
 * a unit pinching out rather than a package edge. */
export const TiePointsOnly: Story = {
  args: { statusFilter: ["absolute", "relative", "spike", "imposed"] },
};
