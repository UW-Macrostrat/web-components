import { createContext, ReactNode, useContext, useMemo } from "react";
import h from "@macrostrat/hyper";
import {
  CompositeColumnScale,
  createCompositeScale,
} from "../prepare-units/composite-scale";
import { ColumnAxisType } from "@macrostrat/column-components";
import type { ExtUnit, PackageLayoutData } from "../prepare-units";
// An isolated jotai store for Macrostrat column usage
// TODO: there might be a better way to do this using the MacrostratDataProvider or similar
import { createIsolation } from "jotai-scope";
import { atom, type WritableAtom } from "jotai";

const { Provider, useAtom, useAtomValue, useStore } = createIsolation();

type ProviderProps = {
  children: ReactNode;
  initialValues?: Iterable<[WritableAtom<any, any, any>, any]>;
};

const columnUnitsAtom = atom<ExtUnit[]>();

const columnUnitsMapAtom = atom<Map<number, ExtUnit> | null>((get) => {
  const units = get(columnUnitsAtom);
  if (!units) return null;
  const unitMap = new Map<number, ExtUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.unit_id, unit);
  });
  return unitMap;
});

function ScopedProvider({ children, ...rest }: ProviderProps) {
  // Always use the same store instance in this tree
  let val = null;
  try {
    val = useStore();
  } catch {
    // No store found, create a new one
    val = null;
  }
  return h(Provider, { store: val, ...rest }, children);
}

export function MacrostratColumnStateProvider({
  children,
  units,
}: {
  children: ReactNode;
  units: ExtUnit[];
}) {
  /** Top-level provider for Macrostrat column data.
   * It is either provided by the Column component itself, or
   * can be hoisted higher in the tree to provide a common data context
   */
  return h(
    ScopedProvider,
    {
      initialValues: [[columnUnitsAtom, units]],
    },
    children,
  );
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

  return h(
    MacrostratColumnStateProvider,
    { units },
    h(MacrostratColumnDataContext.Provider, { value }, children),
  );
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
  return useAtomValue(columnUnitsAtom);
}

export function useColumnUnitsMap(): Map<number, ExtUnit> | null {
  try {
    return useAtomValue(columnUnitsMapAtom);
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
