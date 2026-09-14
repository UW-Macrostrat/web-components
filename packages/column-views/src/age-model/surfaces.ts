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
  useMemo,
  useRef,
  useState,
} from "react";
import type { NoteData } from "@macrostrat/column-components";
import { useCompositeScale, useMacrostratColumnData } from "../data-provider";
import { ColumnNotes } from "../notes";
import { AgeLabel } from "../unit-details/age-range";
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
  /** Width of the labels column, connector included */
  labelWidth?: number;
  labelPaddingLeft?: number;
  /** Only show surfaces with these statuses */
  statuses?: SurfaceStatus[] | null;
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
  /** Total width, connector included */
  width?: number;
  paddingLeft?: number;
  className?: string;
}

interface SurfaceNote extends NoteData {
  surface: ColumnSurface;
  selected: boolean;
}

/** A notes column of surface labels, laid out beside the units with the
 * collision avoidance of `NotesColumn`. */
export function ColumnSurfaceLabels(props: ColumnSurfaceLabelsProps) {
  const {
    surfaces,
    width = 170,
    paddingLeft = 24,
    selectedSurface,
    onSelectSurface,
    className,
  } = props;
  const { axisType } = useMacrostratColumnData();

  const notes: SurfaceNote[] = useMemo(() => {
    const _notes: SurfaceNote[] = [];
    for (const surface of surfaces) {
      const position = surfacePosition(surface, axisType);
      if (position == null) continue;
      _notes.push({
        id: surface.id,
        height: position,
        note: surfaceLabel(surface),
        surface,
        selected: surface.id === selectedSurface,
      });
    }
    return _notes;
  }, [surfaces, axisType, selectedSurface]);

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
    }),
  );
}

function SurfaceNoteLabel({ note }: { note: SurfaceNote }) {
  const { surface, selected } = note;
  const { calibration } = surface;

  let primary: string = surfaceStatusLabels[surface.status] + " surface";
  let secondary: any = h(AgeLabel, { age: surface.age });
  if (calibration != null) {
    primary = calibration.name;
    const prop = formatProportion(surface.proportion);
    if (prop != null) {
      primary += ` · ${prop}`;
    }
  }

  return h(
    "div.surface-label",
    { className: classNames(surfaceClasses(surface), { selected }) },
    [
      h("div.surface-label-marker"),
      h("div.surface-label-text", [
        h("div.surface-label-primary", primary),
        h("div.surface-label-secondary", secondary),
      ]),
    ],
  );
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

/** Measure where the units column sits within the `Column`, so an overlay
 * can cover exactly the units rather than the axes. Re-measures on resize.
 * `null` while unmeasured, when disabled, or when the units column can't be
 * found. */
function useUnitsColumnExtent(
  ref: RefObject<HTMLDivElement | null>,
  enabled: boolean,
): HorizontalExtent | null {
  const [extent, setExtent] = useState<HorizontalExtent | null>(null);

  useEffect(() => {
    if (!enabled) {
      setExtent(null);
      return;
    }
    const parent = ref.current?.parentElement;
    if (parent == null) return;
    const target = parent.querySelector<HTMLElement>(
      `.${unitsContainerClass()}`,
    );
    if (target == null) return;

    function measure() {
      const p = parent.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const next = { left: t.left - p.left, width: t.width };
      setExtent((prev) => {
        if (prev?.left === next.left && prev?.width === next.width) {
          return prev;
        }
        return next;
      });
    }

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled]);

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
