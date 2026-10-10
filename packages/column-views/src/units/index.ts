import h from "@macrostrat/hyper";
import {
  LithologyColumn,
  useGeologicPattern,
} from "@macrostrat/column-components";
import { UnitNamesColumn } from "./names";
import { ICompositeUnitProps } from "./composite";
import { UnitBoxes } from "./boxes";
export { UnitSelectionStyle } from "./boxes";
import { useColumnLayout } from "@macrostrat/column-components";
import { useInDarkMode } from "@macrostrat/ui-components";
import {
  getBestFGDCPatternForUnit,
  getMixedUnitColor,
} from "@macrostrat/stratigraphy-utils";
import { TrackedLabeledUnit } from "./composite";
import { useEnvironments, useLithologies } from "@macrostrat/data-provider";
import { useMemo } from "react";
import { BaseUnit, Lithology } from "@macrostrat/api-types";
import { UnitWithLayoutParameters } from "../prepare-units/helpers.ts";

export * from "./composite";
export * from "./types";
export * from "./grainsize";

export function UnitsColumn({ width = 100 }) {
  /*
  A column showing units with USGS color fill
  */
  return h(LithologyColumn, { width }, h(UnitBoxes));
}

export function SimpleUnitsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const { columnWidth, width, gutterWidth = 0, labelOffset = 30 } = props;

  return h([
    h(UnitsColumn, {
      width: columnWidth,
    }),
    h(UnitNamesColumn, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth,
    }),
  ]);
}

export function BasicUnitComponent({ division, ...rest }) {
  /** A unit that allows directly setting colors and patterns. */

  return h(UnitComponent, {
    division,
    ...rest,
    backgroundColor: division.color,
    patternID: division.patternID,
  });
}

interface UnitComponentProps<T extends BaseUnit> {
  division: UnitWithLayoutParameters<T> | T;
  /** The most internal columns overlapping units spread across; unset, as
   * many as the overlaps need */
  nColumns?: number;
  width?: number;
}

export function UnitComponent<T extends BaseUnit>({
  division,
  nColumns,
  ...rest
}: UnitComponentProps<T>) {
  const width = rest.width ?? useColumnLayout()?.width;

  // Without a layout the unit takes its full width from the column
  if (!("layout" in division)) {
    return h(TrackedLabeledUnit, { division, ...rest });
  }

  // `nColumns` caps the internal columns (`maxInternalColumns` on `Column`).
  // Past the cap, units share the last column and overlap there.
  const { layout } = division;
  let totalColumns = layout.totalColumns;
  if (nColumns != null && !isNaN(nColumns)) {
    totalColumns = Math.max(1, Math.min(totalColumns, nColumns));
  }
  const columnIx = Math.min(layout.column, totalColumns - 1);

  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: width / totalColumns / layout.nColumns,
    x: (columnIx * width) / totalColumns,
  });
}

interface UnitColorOptions {
  asBackground?: boolean;
}

export function useUnitColor(unit, opts: UnitColorOptions = {}): string | null {
  /** Get the color for a unit based on its lithology */
  const lithMap = useLithologies();
  const inDarkMode = useInDarkMode();
  const { asBackground = true } = opts;

  return useMemo(() => {
    if (unit == null || lithMap == null) return null;
    return getMixedUnitColor(unit, lithMap, inDarkMode, asBackground);
  }, [unit?.unit_id, lithMap, inDarkMode, asBackground]);
}

export function ColoredUnitComponent(props) {
  /** A unit component that is colored using a mixture of lithologies.
   * This is a separate component because it depends on more providers/contexts to determine coloring. */
  const backgroundColor = useUnitColor(props.division);

  const patternID = useMemo(() => {
    return getBestFGDCPatternForUnit(props.division); // ?? getPatternID(props.division.lith, lithMap);
  }, [props.division?.unit_id]);

  const fill = useGeologicPattern(patternID);

  return h(UnitComponent, {
    fill,
    backgroundColor,
    ...props,
  });
}

export function useUnitColorByEnvironment(
  unit,
  opts: UnitColorOptions = {},
): string | null {
  /** Get the color for a unit based on its lithology */
  const environmentMap = useEnvironments();
  const lithMap = useLithologies();
  const inDarkMode = useInDarkMode();
  const { asBackground = true } = opts;

  return useMemo(() => {
    if (unit == null || environmentMap == null) return null;
    let c = getMixedUnitColor(unit, environmentMap, inDarkMode, asBackground, {
      key: "environ",
      id_key: "environ_id",
    });
    if (c != null) {
      return c;
    }
    // Fallback to lithology color if no environment color is found
    return getMixedUnitColor(unit, lithMap, inDarkMode, asBackground);
  }, [unit?.unit_id, environmentMap, lithMap, inDarkMode, asBackground]);
}

export function EnvironmentColoredUnitComponent(props) {
  /** A unit component that is colored using a mixture of lithologies.
   * This is a separate component because it depends on more providers/contexts to determine coloring. */
  const backgroundColor = useUnitColorByEnvironment(props.division);

  const patternID = useMemo(() => {
    return getBestFGDCPatternForUnit(props.division); // ?? getPatternID(props.division.lith, lithMap);
  }, [props.division?.unit_id]);

  const fill = useGeologicPattern(patternID);

  return h(UnitComponent, {
    fill,
    backgroundColor,
    ...props,
  });
}
