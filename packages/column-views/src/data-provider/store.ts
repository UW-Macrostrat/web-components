import { createContext, ReactNode, useContext, useMemo } from "react";
import h from "@macrostrat/hyper";
import {
  CompositeColumnScale,
  createCompositeScale,
} from "../prepare-units/composite-scale";
import { ColumnAxisType } from "@macrostrat/column-components";
import type { ExtUnit, PackageLayoutData } from "../prepare-units";
// An isolated jotai store for Macrostrat column usage
import { createIsolation } from "jotai-scope";
import { atom } from "jotai";

const { Provider, useAtom, useStore } = createIsolation();

function MacrostratColumnProvider({ children }: { children: ReactNode }) {
  // Always use the same store instance in this tree
  let val = null;
  try {
    val = useStore();
  } catch {
    // No store found, create a new one
    val = null;
  }

  return h(Provider, { store: val }, children);
}

export interface MacrostratColumnDataContext {
  units: ExtUnit[];
  sections: PackageLayoutData[];
  totalHeight?: number;
  axisType?: ColumnAxisType;
}

const MacrostratColumnDataContext =
  createContext<MacrostratColumnDataContext>(null);

export function MacrostratColumnDataProvider({
  children,
  units,
  sections,
  totalHeight,
  axisType,
}: MacrostratColumnDataContext & { children: ReactNode }) {
  /** Internal provider for Macrostrat column data.
   * As a general rule, we want to provide data and column-axis
   * height calculations through the context, since these need to
   * be accessed by any component that lays out information on the
   * column.
   *
   * Cross-axis layout and view configuration (e.g., showing and hiding
   * of different components or labels) should be handled through passing
   * props to the components themselves.
   * */

  const value = useMemo(() => {
    // For now, change ordinal axis types to age axis types
    return {
      units,
      sections,
      totalHeight,
      axisType,
    };
  }, [units, sections, totalHeight, axisType]);

  return h(MacrostratColumnDataContext.Provider, { value }, children);
}

export function useMacrostratColumnData() {
  const ctx = useContext(MacrostratColumnDataContext);
  if (!ctx) {
    throw new Error(
      "useMacrostratColumnData must be used within a MacrostratColumnDataProvider",
    );
  }
  return ctx;
}

export function useMacrostratUnits() {
  return useMacrostratColumnData().units;
}

export function useColumnUnitsMap(): Map<number, ExtUnit> | null {
  const ctx = useContext(MacrostratColumnDataContext);
  return useMemo(() => {
    if (ctx == null) return null;
    const unitMap = new Map<number, ExtUnit>();
    ctx.units.forEach((unit) => {
      unitMap.set(unit.unit_id, unit);
    });
    return unitMap;
  }, [ctx?.units]);
}

export function useCompositeScale(): CompositeColumnScale {
  const ctx = useMacrostratColumnData();
  return useMemo(
    () => createCompositeScale(ctx.sections, true),
    [ctx.sections],
  );
}
