import h from "@macrostrat/hyper";
import {
  LithologyColumn,
  useGeologicPattern,
} from "@macrostrat/column-components";
import { UnitNamesColumn } from "./names";
import { ICompositeUnitProps } from "./composite";
import { UnitBoxes } from "./boxes";
import { useColumnLayout } from "@macrostrat/column-components";
import { useInDarkMode } from "@macrostrat/ui-components";
import { getMixedUnitColor } from "./colors";
import { TrackedLabeledUnit } from "./composite";
import { useLithologies } from "../data-provider";
import { useMemo } from "react";
import { resolveID } from "./resolvers";
import { Lithology } from "@macrostrat/api-types";

export * from "./composite";
export * from "./types";
export * from "./selection";
export * from "./colors";

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

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const width = rest.width ?? useColumnLayout()?.width;

  const nOverlappingUnits = division.overlappingUnits?.length ?? 0;
  const columnIx = (division.column ?? 0) % nColumns;

  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: nOverlappingUnits > 0 ? width / nColumns : width,
    x: (columnIx * width) / nColumns,
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
    return resolveID(props.division); // ?? getPatternID(props.division.lith, lithMap);
  }, [props.division?.unit_id]);

  const fill = useGeologicPattern(patternID);

  return h(UnitComponent, {
    fill,
    backgroundColor,
    ...props,
  });
}

function getPatternID(
  liths: Array<Lithology>,
  lithMap: Map<number, Lithology>
): string | null {
  if (lithMap == null || liths == null || liths.length == 0) {
    return null;
  }
  const patternIDs = new Set<string>();
  for (const lith of liths) {
    const lithData = lithMap.get(lith.lith_id);
    if (lithData) {
      patternIDs.add(`${lithData.fill}`);
    }
  }
  let id = patternIDs.values()[0];
  if (id == "0") return null;
  return id;
}
