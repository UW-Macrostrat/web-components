/** The surfaces view: age-model calibration surfaces drawn on a column.
 *
 * `ColumnSurfaces` is dropped into a `Column` as a child. It draws one line
 * per surface across the units (`ColumnSurfaceLines`) and a notes column of
 * labels beside them (`ColumnSurfaceLabels`), styled by `boundary_status` and
 * `boundary_type`, with hover and selection.
 */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NoteData } from "@macrostrat/column-components";
import {
  type IntervalShort,
  IntervalTag,
  TagSize,
} from "@macrostrat/data-components";
import { useMacrostratDefs } from "@macrostrat/data-provider";
import {
  useClaimLabelColumn,
  useCompositeScale,
  useMacrostratColumnData,
} from "../data-provider";
import { ColumnNotes } from "../notes";
import { AgeLabel, Proportion } from "../unit-details/age-range";
import columnStyles from "../column.module.sass";
import styles from "./surfaces.module.sass";
import {
  type ColumnSurface,
  type SurfaceStatus,
  formatProportion,
  surfaceLabel,
  surfacePosition,
  surfaceStatusLabels,
  surfaceToken,
  TIE_POINT_STATUSES,
} from "./types";
import { type UseColumnSurfacesOptions, useColumnSurfaces } from "./data";

const h = hyper.styled(styles);

/** How far the surface lines extend: across the units column only, or the
 * full width of the column including its axes. */
export type SurfaceLinesExtent = "units" | "column";

export type SurfaceSelectionHandler = (surface: ColumnSurface | null) => void;

export interface SurfaceSelectionProps {
  /** The selected surface's id. Pass `null` for a controlled, empty
   * selection; leave undefined for the component to manage selection. */
  selectedSurface?: ColumnSurface["id"] | null;
  onSelectSurface?: SurfaceSelectionHandler;
}

export interface ColumnSurfacesProps
  extends UseColumnSurfacesOptions, SurfaceSelectionProps {
  showLines?: boolean;
  showLabels?: boolean;
  extent?: SurfaceLinesExtent;
  /** Width of the labels column, connector included (default 200) */
  labelWidth?: number;
  labelPaddingLeft?: number;
  /** Only show surfaces with these statuses */
  statuses?: SurfaceStatus[] | null;
  /** Which surfaces get a label. Defaults to the tie points — the statuses
   * at which the age model was constrained — so interpolated (`modeled`),
   * unspecified and unit-derived surfaces are drawn as lines only. Pass
   * `null` to label every surface shown. */
  labelStatuses?: SurfaceStatus[] | null;
  /** Labels closer than this (in pixels) are thinned out, since the column
   * has finite room; the selected surface's label is always kept. */
  minLabelSpacing?: number;
  className?: string;
}

export function ColumnSurfaces(props: ColumnSurfacesProps) {
  const {
    showLines = true,
    showLabels = true,
    extent = "units",
    labelWidth,
    labelPaddingLeft,
    statuses,
    labelStatuses = TIE_POINT_STATUSES,
    minLabelSpacing,
    selectedSurface,
    onSelectSurface,
    className,
    ...dataOptions
  } = props;

  const { surfaces: allSurfaces } = useColumnSurfaces(dataOptions);
  const surfaces = useMemo(
    () => filterByStatus(allSurfaces, statuses),
    [allSurfaces, statuses],
  );

  const [selectedID, select] = useSurfaceSelection(
    selectedSurface,
    onSelectSurface,
  );

  return h([
    h.if(showLines)(ColumnSurfaceLines, {
      surfaces,
      extent,
      selectedSurface: selectedID,
      onSelectSurface: select,
      className,
    }),
    h.if(showLabels)(ColumnSurfaceLabels, {
      surfaces,
      labelStatuses,
      minLabelSpacing,
      width: labelWidth,
      paddingLeft: labelPaddingLeft,
      selectedSurface: selectedID,
      onSelectSurface: select,
      className,
    }),
  ]);
}

export interface ColumnSurfaceLinesProps extends SurfaceSelectionProps {
  surfaces: ColumnSurface[];
  extent?: SurfaceLinesExtent;
  className?: string;
}

/** One horizontal line per surface, overlaid on the column at the surface's
 * age (or measured position, for height and depth columns). */
export function ColumnSurfaceLines(props: ColumnSurfaceLinesProps) {
  const {
    surfaces,
    extent = "units",
    selectedSurface,
    onSelectSurface,
    className,
  } = props;
  const scale = useCompositeScale();
  const { axisType, totalHeight } = useMacrostratColumnData();

  const ref = useRef<HTMLDivElement>(null);
  const unitsExtent = useUnitsColumnExtent(ref, extent === "units");

  let style: CSSProperties = { height: totalHeight };
  if (unitsExtent != null) {
    style = { ...style, left: unitsExtent.left, width: unitsExtent.width };
  }
  const measuring = extent === "units" && unitsExtent == null;

  return h(
    "div.column-surface-lines",
    { ref, style, className: classNames(className, { measuring }) },
    surfaces.map((surface) => {
      const position = surfacePosition(surface, axisType);
      if (position == null) return null;
      const y = scale(position);
      if (y == null) return null;
      return h(SurfaceLine, {
        key: surface.id,
        surface,
        y,
        selected: surface.id === selectedSurface,
        onSelect: onSelectSurface,
      });
    }),
  );
}

function SurfaceLine({
  surface,
  y,
  selected,
  onSelect,
}: {
  surface: ColumnSurface;
  y: number;
  selected: boolean;
  onSelect?: SurfaceSelectionHandler;
}) {
  const onClick = useCallback(
    (evt: MouseEvent) => {
      // Don't let the column deselect its unit
      evt.stopPropagation();
      if (selected) {
        onSelect?.(null);
      } else {
        onSelect?.(surface);
      }
    },
    [surface, selected, onSelect],
  );

  return h(
    "div.surface-line",
    {
      style: { top: y },
      className: classNames(surfaceClasses(surface), {
        selected,
        interactive: onSelect != null,
      }),
      title: surfaceLabel(surface),
      onClick,
    },
    h("div.surface-line-inner"),
  );
}

export interface ColumnSurfaceLabelsProps extends SurfaceSelectionProps {
  surfaces: ColumnSurface[];
  /** Which surfaces get a label (see `ColumnSurfacesProps.labelStatuses`) */
  labelStatuses?: SurfaceStatus[] | null;
  /** Minimum pixel spacing between labels (see `ColumnSurfacesProps`) */
  minLabelSpacing?: number;
  /** Total width, connector included */
  width?: number;
  paddingLeft?: number;
  className?: string;
}

interface SurfaceNote extends NoteData {
  surface: ColumnSurface;
  /** The calibration interval, with color and rank from the definitions */
  interval: IntervalShort | null;
  selected: boolean;
}

/** A notes column of surface labels, laid out beside the units with the
 * collision avoidance of `NotesColumn`. It takes the label column over from
 * the unit labels while mounted: labels are one or the other. */
export function ColumnSurfaceLabels(props: ColumnSurfaceLabelsProps) {
  const {
    surfaces,
    labelStatuses = TIE_POINT_STATUSES,
    minLabelSpacing = 22,
    width = 200,
    paddingLeft = 24,
    selectedSurface,
    onSelectSurface,
    className,
  } = props;
  const { axisType } = useMacrostratColumnData();
  const scale = useCompositeScale();
  useClaimLabelColumn();

  const labeled = useMemo(() => {
    const byStatus = filterByStatus(surfaces, labelStatuses);
    return thinByPixelSpacing(
      byStatus,
      (s) => scale(surfacePosition(s, axisType) ?? NaN),
      minLabelSpacing,
      selectedSurface,
    );
  }, [
    surfaces,
    labelStatuses,
    minLabelSpacing,
    selectedSurface,
    scale,
    axisType,
  ]);

  // Interval colors come from the definitions table; the age model itself
  // doesn't carry them
  const intervalIDs = useMemo(() => {
    const ids = new Set<number>();
    for (const s of labeled) {
      if (s.calibration != null) ids.add(s.calibration.id);
    }
    return Array.from(ids);
  }, [labeled]);
  const intervalMap = useMacrostratDefs("intervals", intervalIDs, null);

  const notes: SurfaceNote[] = useMemo(() => {
    const _notes: SurfaceNote[] = [];
    for (const surface of labeled) {
      const position = surfacePosition(surface, axisType);
      if (position == null) continue;
      _notes.push({
        id: surface.id,
        height: position,
        note: surfaceLabel(surface),
        surface,
        interval: calibrationInterval(surface, intervalMap),
        selected: surface.id === selectedSurface,
      });
    }
    return _notes;
  }, [labeled, axisType, selectedSurface, intervalMap]);

  const onClickNote = useCallback(
    (note: NoteData) => {
      const { surface, selected } = note as SurfaceNote;
      if (selected) {
        onSelectSurface?.(null);
      } else {
        onSelectSurface?.(surface);
      }
    },
    [onSelectSurface],
  );

  return h(
    "div.column-surface-labels",
    { className },
    h(ColumnNotes, {
      notes,
      width,
      paddingLeft,
      noteComponent: SurfaceNoteLabel,
      onClickNote,
      forceOptions: LABEL_FORCE_OPTIONS,
    }),
  );
}

/** Breathing room between stacked labels, in pixels */
const LABEL_FORCE_OPTIONS = { nodeSpacing: 2 };

/** A surface's label: its calibration interval as the standard interval tag
 * (with the position within the interval as the tag's detail), and the
 * modeled age beneath. Surfaces without a calibration show their status. */
function SurfaceNoteLabel({ note }: { note: SurfaceNote }) {
  const { surface, interval, selected } = note;

  let primary: any;
  if (interval != null) {
    primary = h(IntervalTag, {
      interval,
      size: TagSize.Small,
      prefix: h(Proportion, { value: surface.proportion }),
      className: "surface-interval-tag",
    });
  } else {
    primary = h(
      "span.surface-label-status",
      `${surfaceStatusLabels[surface.status]} surface`,
    );
  }

  return h(
    "div.surface-label",
    { className: classNames(surfaceClasses(surface), { selected }) },
    h("div.surface-label-primary", primary),
  );
}

/** The calibration interval in the shape the interval tag takes, colored
 * from the definitions when they have loaded. */
function calibrationInterval(
  surface: ColumnSurface,
  intervalMap: Map<number, any> | null,
): IntervalShort | null {
  const { calibration } = surface;
  if (calibration == null) return null;
  const def = intervalMap?.get(calibration.id);
  return {
    id: calibration.id,
    name: calibration.name,
    b_age: calibration.b_age,
    t_age: calibration.t_age,
    color: def?.color,
    rank: def?.rank,
  };
}

/** Class names shared by the lines, labels, legend and tags, so a status or
 * type reads the same everywhere. */
export function surfaceClasses(surface: {
  status?: SurfaceStatus | null;
  type?: string | null;
}): string {
  return classNames(
    `status-${surfaceToken(surface.status)}`,
    `type-${surfaceToken(surface.type)}`,
  );
}

/** Walk the surfaces down the column and drop any whose label would sit
 * within `minSpacing` pixels of the last one kept. The selected surface is
 * always kept (and displaces a neighbor if need be). */
function thinByPixelSpacing(
  surfaces: ColumnSurface[],
  pixelPosition: (s: ColumnSurface) => number | null,
  minSpacing: number,
  selectedSurface: ColumnSurface["id"] | null | undefined,
): ColumnSurface[] {
  if (minSpacing <= 0) return surfaces;
  const positioned = surfaces
    .map((surface) => ({ surface, y: pixelPosition(surface) }))
    .filter((d) => d.y != null && !Number.isNaN(d.y))
    .sort((a, b) => a.y - b.y);

  const kept: { surface: ColumnSurface; y: number }[] = [];
  for (const item of positioned) {
    const selected = item.surface.id === selectedSurface;
    const last = kept[kept.length - 1];
    if (last == null || item.y - last.y >= minSpacing) {
      kept.push(item);
    } else if (selected) {
      // The selection wins its slot
      kept[kept.length - 1] = item;
    }
  }
  return kept.map((d) => d.surface);
}

function filterByStatus(
  surfaces: ColumnSurface[],
  statuses: SurfaceStatus[] | null | undefined,
): ColumnSurface[] {
  if (statuses == null) return surfaces;
  const allowed = new Set(statuses);
  return surfaces.filter((d) => allowed.has(d.status));
}

/** Controlled-or-uncontrolled selection: when `selectedID` is passed (even as
 * `null`) the consumer owns it; otherwise it is kept internally. */
function useSurfaceSelection(
  selectedID: ColumnSurface["id"] | null | undefined,
  onSelect: SurfaceSelectionHandler | undefined,
): [ColumnSurface["id"] | null, SurfaceSelectionHandler] {
  const [internal, setInternal] = useState<ColumnSurface["id"] | null>(null);
  const isControlled = selectedID !== undefined;

  const select: SurfaceSelectionHandler = useCallback(
    (surface) => {
      setInternal(surface?.id ?? null);
      onSelect?.(surface);
    },
    [onSelect],
  );

  let current = internal;
  if (isControlled) {
    current = selectedID;
  }
  return [current, select];
}

interface HorizontalExtent {
  left: number;
  width: number;
}

/** `useLayoutEffect` in the browser, `useEffect` on the server — where it
 * would warn and has nothing to measure anyway. */
const useMeasureEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Measure where the units column sits within the `Column`, so an overlay
 * can cover exactly the units rather than the axes. `null` while unmeasured,
 * when disabled, or when the units column can't be found. */
function useUnitsColumnExtent(
  ref: RefObject<HTMLDivElement | null>,
  enabled: boolean,
): HorizontalExtent | null {
  const [extent, setExtent] = useState<HorizontalExtent | null>(null);

  const measure = useCallback(() => {
    if (!enabled) return;
    const parent = ref.current?.parentElement;
    const target = parent?.querySelector<HTMLElement>(
      `.${unitsContainerClass()}`,
    );
    if (parent == null || target == null) return;

    const p = parent.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const next = { left: t.left - p.left, width: t.width };
    setExtent((prev) => {
      if (prev?.left === next.left && prev?.width === next.width) {
        return prev;
      }
      return next;
    });
  }, [enabled]);

  // Re-measure on every render as a backstop: cheap, and it catches layout
  // changes that no observer reports.
  useMeasureEffect(measure);

  useMeasureEffect(() => {
    if (!enabled) {
      setExtent(null);
      return;
    }
    const parent = ref.current?.parentElement;
    if (parent == null) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    // The units column *moves* when a sibling changes width — the timescale
    // widening once its intervals load, or its level count changing — and
    // that is not a resize of the units column or of the column itself, so
    // the siblings have to be watched too.
    observer.observe(parent);
    for (const child of Array.from(parent.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [enabled, measure]);

  return extent;
}

/** The (module-scoped) class of the units container rendered by
 * `SectionsColumn`. */
function unitsContainerClass(): string {
  const s = columnStyles as any;
  return (
    s["section-units-container"] ??
    s.sectionUnitsContainer ??
    "section-units-container"
  );
}
