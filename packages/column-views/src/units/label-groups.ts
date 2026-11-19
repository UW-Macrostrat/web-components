/** Coalescing of repeated labels: a run of touching units that share a label
 * (a formation split into lithologic units, say) is labeled once, across the
 * whole run, rather than once per unit. */
import h from "@macrostrat/hyper";
import { ColumnAxisType, ColumnContext } from "@macrostrat/column-components";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { getUnitHeightRange } from "../prepare-units/utils";

export interface LabelGroup<T = any> {
  label: string;
  /** Members, top to bottom */
  units: T[];
  /** Axis positions spanned by the group, as [bottom, top] */
  heightRange: [number, number];
}

export interface LabelGroupOptions<T> {
  axisType: ColumnAxisType;
  /** Pixel position of an axis value, used to decide whether units touch */
  scale: (value: number) => number;
  nameForUnit: (unit: T) => string;
  /** Whether two touching units may share a label (e.g. same internal column) */
  canJoin?: (upper: T, lower: T) => boolean;
  /** Join units that overlap, not only those that abut */
  joinOverlapping?: boolean;
}

/** Gaps narrower than this many pixels still count as touching */
const TOUCH_TOLERANCE = 0.5;

/** Group units whose drawn boxes touch and share a label. Groups come back
 * in the order of their topmost units. */
export function groupUnitsByLabel<T>(
  units: T[],
  options: LabelGroupOptions<T>,
): LabelGroup<T>[] {
  const { axisType, scale, nameForUnit, canJoin, joinOverlapping } = options;

  const extents = units.map((unit) => {
    const heightRange = getUnitHeightRange(unit as any, axisType);
    const [y0, y1] = heightRange.map(scale);
    return {
      unit,
      heightRange,
      label: nameForUnit(unit),
      top: Math.min(y0, y1),
      bottom: Math.max(y0, y1),
    };
  });
  extents.sort((a, b) => a.top - b.top);

  type Extent = (typeof extents)[number];
  const groups: { label: string; members: Extent[]; bottom: number }[] = [];
  const openGroups = new Map<string, typeof groups>();

  for (const extent of extents) {
    const candidates = openGroups.get(extent.label) ?? [];
    const group = candidates.find((g) => {
      const last = g.members[g.members.length - 1];
      if (canJoin != null && !canJoin(last.unit, extent.unit)) return false;
      const gap = extent.top - g.bottom;
      if (gap > TOUCH_TOLERANCE) return false;
      // Without `joinOverlapping`, only a unit starting at the group's base joins
      return joinOverlapping || gap > -TOUCH_TOLERANCE;
    });
    if (group != null) {
      group.members.push(extent);
      group.bottom = Math.max(group.bottom, extent.bottom);
      continue;
    }
    const newGroup = {
      label: extent.label,
      members: [extent],
      bottom: extent.bottom,
    };
    groups.push(newGroup);
    candidates.push(newGroup);
    openGroups.set(extent.label, candidates);
  }

  return groups.map(({ label, members }) => {
    const ranges = members.map((d) => d.heightRange);
    return {
      label,
      units: members.map((d) => d.unit),
      heightRange: spanOfRanges(ranges, axisType),
    };
  });
}

export interface UnitLabelGroupMembership<T = any> {
  group: LabelGroup<T>;
  /** The member that draws the group's label: the last one painted, so the
   * other members' boxes don't cover it */
  isLeader: boolean;
}

const LabelGroupsContext = createContext<Map<
  number,
  UnitLabelGroupMembership
> | null>(null);

/** Inline label groups for the units of the enclosing column. */
export function InlineLabelGroupsProvider(props: {
  nameForUnit: (unit: any) => string;
  enabled?: boolean;
  children?: ReactNode;
}) {
  const { nameForUnit, enabled = true, children } = props;
  const { divisions, scale, axisType } = useContext(ColumnContext);

  const value = useMemo(() => {
    if (!enabled || divisions == null || scale == null) return null;
    const units = divisions as any[];
    const groups = groupUnitsByLabel(units, {
      axisType,
      scale,
      nameForUnit,
      canJoin: sameInternalColumn,
    });
    // Units are painted in division order
    const paintOrder = new Map(units.map((d, i) => [d.unit_id, i]));
    const membership = new Map<number, UnitLabelGroupMembership>();
    for (const group of groups) {
      if (group.units.length < 2) continue;
      const leader = group.units.reduce((a, b) =>
        paintOrder.get(a.unit_id) > paintOrder.get(b.unit_id) ? a : b,
      );
      for (const unit of group.units) {
        membership.set(unit.unit_id, { group, isLeader: unit === leader });
      }
    }
    return membership;
  }, [enabled, divisions, scale, axisType, nameForUnit]);

  return h(LabelGroupsContext.Provider, { value }, children);
}

/** The label group a unit belongs to, if it shares its label with others */
export function useUnitLabelGroup(
  unit: { unit_id: number } | null,
): UnitLabelGroupMembership | null {
  const membership = useContext(LabelGroupsContext);
  if (unit == null) return null;
  return membership?.get(unit.unit_id) ?? null;
}

function sameInternalColumn(a: any, b: any): boolean {
  return (
    a.layout?.column == b.layout?.column &&
    a.layout?.totalColumns == b.layout?.totalColumns
  );
}

function spanOfRanges(
  ranges: [number, number][],
  axisType: ColumnAxisType,
): [number, number] {
  const bottoms = ranges.map((d) => d[0]);
  const tops = ranges.map((d) => d[1]);
  // Ages and depths increase downwards; heights increase upwards
  if (axisType == ColumnAxisType.AGE || axisType == ColumnAxisType.DEPTH) {
    return [Math.max(...bottoms), Math.min(...tops)];
  }
  return [Math.min(...bottoms), Math.max(...tops)];
}
