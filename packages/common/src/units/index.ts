import h from "@macrostrat/hyper";
import { LithologyColumn } from "@macrostrat/column-components";
import { UnitNamesColumn } from "./names";
import { CompositeUnitsColumn, ICompositeUnitProps } from "./composite";
import { UnitBoxes } from "./boxes";

const UnitsColumn = ({ width = 100 }) => {
  /*
  A column showing units with USGS color fill
  */
  return h(LithologyColumn, { width }, h(UnitBoxes));
};

const SimpleUnitsColumn = (props: ICompositeUnitProps) => {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const { columnWidth, width, gutterWidth = 0, labelOffset = 30 } = props;

  return h([
    h(UnitsColumn, {
      width: columnWidth
    }),
    h(UnitNamesColumn, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth
    })
  ]);
};

export {
  UnitsColumn,
  UnitNamesColumn,
  SimpleUnitsColumn,
  CompositeUnitsColumn,
  ICompositeUnitProps
};
export * from "./composite";
export * from "./types";
export * from "./selection";
