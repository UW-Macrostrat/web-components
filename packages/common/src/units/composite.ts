import { hyperStyled } from "@macrostrat/hyper";
import {
  LithologyColumn,
  useColumn,
  useColumnDivisions
} from "@macrostrat/column-components";
import { defaultNameFunction, UnitNamesColumn, UnitDataColumn } from "./names";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback
} from "react";
import { LabeledUnit, UnitBoxes } from "./boxes";
import { UnitLong } from "@macrostrat/api-types";
import styles from "./composite.module.styl";

const h = hyperStyled(styles);

interface LabelTracker {
  [key: number]: boolean;
}

const LabelTrackerContext = createContext(null);
const UnlabeledDivisionsContext = createContext(null);

function LabelTrackerProvider(props) {
  const { children } = props;
  const { divisions } = useColumn();
  const [unlabeledDivisions, setUnlabeledDivisions] = useState<IUnit[] | null>(
    null
  );
  const labelTrackerRef = useRef<LabelTracker>({});
  const trackLabelVisibility = useCallback(
    (div, visible) => {
      labelTrackerRef.current[div.unit_id] = visible;
      if (Object.keys(labelTrackerRef.current).length == divisions.length) {
        setUnlabeledDivisions(
          divisions.filter(d => labelTrackerRef.current[d.unit_id] == false)
        );
      }
    },
    [labelTrackerRef, divisions]
  );

  const value = trackLabelVisibility;
  return h(
    LabelTrackerContext.Provider,
    { value },
    h(
      UnlabeledDivisionsContext.Provider,
      { value: unlabeledDivisions },
      children
    )
  );
}

type BaseUnitProps =
  | {
      width: number;
      showLabels: false;
      columnWidth?: number;
    }
  | {
      width: number;
      columnWidth: number;
      showLabels: true;
    };

export type ICompositeUnitProps = BaseUnitProps & {
  gutterWidth?: number;
  labelOffset?: number;
};

interface ExtUnit extends UnitLong {
  bottomOverlap: boolean;
}

const extendDivision = (
  unit: UnitLong,
  i: number,
  divisions: UnitLong[]
): ExtUnit => {
  const overlappingUnits = divisions.filter(
    d =>
      d.unit_id != unit.unit_id &&
      !(unit.t_age > d.b_age && unit.b_age < d.t_age)
  );
  let bottomOverlap = false;
  for (const d of overlappingUnits) {
    if (d.b_age < unit.b_age) bottomOverlap = true;
  }
  return { ...unit, bottomOverlap };
};

function TrackedLabeledUnit({
  division,
  nameForDivision = defaultNameFunction
}) {
  const trackLabelVisibility = useContext(LabelTrackerContext);
  return h(LabeledUnit, {
    division,
    //halfWidth: div.bottomOverlap,
    label: nameForDivision(division),
    onLabelUpdated(label, visible) {
      trackLabelVisibility(division, visible);
    }
  });
}

function UnlabeledUnitNames(props) {
  const divisions = useContext(UnlabeledDivisionsContext);
  if (divisions == null) return null;
  return h(UnitNamesColumn, { divisions, ...props });
}

function _BaseUnitsColumn(props: React.PropsWithChildren<{ width: number }>) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const { width, children } = props;

  return h(LabelTrackerProvider, [
    h(LithologyColumn, { width }, [
      h(UnitBoxes, {
        unitComponent: TrackedLabeledUnit,
        transformDivision: extendDivision
      })
    ]),
    children
  ]);
}

function AnnotatedUnitsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const {
    columnWidth,
    width = 100,
    gutterWidth = 10,
    labelOffset = 30,
    showLabels = true,
    ...rest
  } = props;

  return h(_BaseUnitsColumn, { width: showLabels ? columnWidth : width }, [
    h(UnitDataColumn, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth,
      ...rest
    })
  ]);
}

function CompositeUnitsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const {
    width = 100,
    gutterWidth = 10,
    labelOffset = 30,
    showLabels = true
  } = props;

  let { columnWidth } = props;
  if (!showLabels) {
    columnWidth = width;
  }

  return h(_BaseUnitsColumn, { width: columnWidth }, [
    h.if(showLabels)(UnlabeledUnitNames, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth
    })
  ]);
}

export { UnitNamesColumn, CompositeUnitsColumn, AnnotatedUnitsColumn };
