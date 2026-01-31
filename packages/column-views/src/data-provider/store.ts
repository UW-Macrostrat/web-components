import { createContext, ReactNode, useContext, useMemo } from "react";
import h from "@macrostrat/hyper";
import {
  CompositeColumnScale,
  createCompositeScale,
} from "../prepare-units/composite-scale";
import { ColumnAxisType } from "@macrostrat/column-components";
import type { ExtUnit, PackageLayoutData } from "../prepare-units";
import {
  allowUnitSelectionAtom,
  selectedUnitIDAtom,
  UnitSelectionCallbacks,
  UnitSelectionCallbackManager,
} from "./unit-selection";
import { BaseUnit } from "@macrostrat/api-types";
import { scope } from "./core";
import type { AtomMap } from "@macrostrat/data-components";
import { atom } from "jotai";

export const columnUnitsAtom = atom<BaseUnit[]>();

export const columnUnitsMapAtom = atom<Map<number, BaseUnit> | null>((get) => {
  const units = get(columnUnitsAtom);
  if (!units) return null;
  const unitMap = new Map<number, BaseUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.unit_id, unit);
  });
  return unitMap;
});

export interface ColumnStateProviderProps<
  T extends BaseUnit,
> extends Partial<UnitSelectionCallbacks> {
  children: ReactNode;
  units: T[];
  selectedUnit: number | null;
  allowUnitSelection?: boolean;
}

export function MacrostratColumnStateProvider<T extends BaseUnit>({
  children,
  units,
  allowUnitSelection = false,
  onUnitSelected,
  selectedUnit,
}: ColumnStateProviderProps<T>) {
  /** Top-level provider for Macrostrat column data.
   * It is either provided by the Column component itself, or
   * can be hoisted higher in the tree to provide a common data context
   */

  /* By default, unit selection is disabled. However, if any related props are passed,
  we enable it.
  */
  const _allowSelection = useMemo(() => {
    if (allowUnitSelection) {
      return true;
    }
    return selectedUnit != null || onUnitSelected != null;
  }, []);

  const atomMap: AtomMap = [
    [columnUnitsAtom, units],
    [allowUnitSelectionAtom, _allowSelection],
    [selectedUnitIDAtom, selectedUnit],
  ];

  let selectionHandlers: ReactNode = null;
  if (_allowSelection) {
    selectionHandlers = h(UnitSelectionCallbackManager, { onUnitSelected });
  }

  return h(
    scope.Provider,
    {
      atoms: atomMap,
      keepUpdated: true,
      inherit: true,
    },
    [selectionHandlers, children],
  );
}

export interface MacrostratColumnDataContext<T extends BaseUnit> {
  units: T[];
  sections: PackageLayoutData[];
  totalHeight?: number;
  axisType?: ColumnAxisType;
  allowUnitSelection?: boolean;
}

export interface ColumnDataProviderProps<T extends BaseUnit>
  extends MacrostratColumnDataContext<T>, ColumnStateProviderProps<T> {
  children: ReactNode;
}

const MacrostratColumnDataContext =
  createContext<MacrostratColumnDataContext<any>>(null);

export function MacrostratColumnDataProvider<T extends BaseUnit>({
  children,
  units,
  sections,
  totalHeight,
  axisType,
  allowUnitSelection,
  onUnitSelected,
  selectedUnit,
}: ColumnDataProviderProps<T>) {
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

  return h(
    MacrostratColumnStateProvider,
    {
      units,
      allowUnitSelection,
      onUnitSelected,
      selectedUnit,
    },
    h(MacrostratColumnDataContext.Provider, { value }, children),
  );
}

export function UnitSelectionProvider(props: ColumnStateProviderProps<any>) {
  /* A basic unit selection provider without column data context.
  Mostly for use with the CorrelationChart component.
   */
  return h(MacrostratColumnStateProvider, {
    ...props,
    allowUnitSelection: true,
  });
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
  return scope.useAtomValue(columnUnitsAtom);
}

export function useColumnUnitsMap(): Map<number, ExtUnit> | null {
  try {
    return scope.useAtomValue(columnUnitsMapAtom) as Map<number, ExtUnit>;
  } catch {
    return null;
  }
}

export function useCompositeScale(): CompositeColumnScale {
  const ctx = useMacrostratColumnData();
  return useMemo(
    () => createCompositeScale(ctx.sections, true),
    [ctx.sections],
  );
}
