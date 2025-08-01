import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import h from "@macrostrat/hyper";
import {
  createCompositeScale,
  PackageLayoutData,
  CompositeColumnScale,
} from "../prepare-units/composite-scale";
import { ExtUnit } from "../prepare-units/helpers";
import { ColumnAxisType } from "@macrostrat/column-components";

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
  /** Provider for Macrostrat column data.
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

export function useCompositeScale(): CompositeColumnScale {
  const ctx = useMacrostratColumnData();
  return useMemo(
    () => createCompositeScale(ctx.sections, true),
    [ctx.sections],
  );
}
