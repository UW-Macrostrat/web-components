import h from "@macrostrat/hyper";
import {
  LithologyColumn,
  PatternDefsProvider,
  NotesColumn,
  ColumnContext,
  INote
} from "@macrostrat/column-components";
import { defaultNameFunction, UnitNamesColumn } from "./names";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback
} from "react";
import { resolveID, scalePattern } from "./resolvers";
import { LabeledUnit } from "./boxes";
import { IUnit } from "./types";

interface LabelTracker {
  [key: number]: boolean;
}

const LabelTrackerContext = createContext(null);
const UnlabeledDivisionsContext = createContext(null);

function LabelTrackerProvider(props) {
  const { children } = props;
  const { divisions } = useContext(ColumnContext);
  const [unlabeledDivisions, setUnlabeledDivisions] = useState<IUnit[] | null>(
    null
  );
  const labelTrackerRef = useRef<LabelTracker>({});
  const trackLabelVisibility = useCallback(
    (div, visible) => {
      console.log(div, visible);
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

export interface ICompositeUnitProps {
  width: number;
  columnWidth: number;
  gutterWidth?: number;
  labelOffset?: number;
}

interface ExtendedUnit extends IUnit {
  bottomOverlap: boolean;
}

const extendDivisions = (divisions: IUnit[]) => (unit: IUnit) => {
  const overlappingUnits = divisions.filter(
    d =>
      d.unit_id != unit.unit_id &&
      !(unit.t_age > d.b_age && unit.b_age < d.t_age)
  );
  console.log(unit, overlappingUnits);

  return unit;
};

function CompositeBoxes(props: {
  divisions: IUnit[];
  nameForDivision?(division: IUnit): string;
}) {
  const { divisions, nameForDivision = defaultNameFunction } = props;
  const trackLabelVisibility = useContext(LabelTrackerContext);

  //const refinedDivisions = divisions.map(extendDivisions(divisions))

  return h(
    PatternDefsProvider,
    { resolveID, scalePattern },
    h(
      "g.divisions",
      divisions.map(div => {
        return h(LabeledUnit, {
          division: div,
          label: nameForDivision(div),
          onLabelUpdated(label, visible) {
            trackLabelVisibility(div, visible);
          }
        });
      })
    )
  );
}

function UnlabeledUnitNames(props) {
  const divisions = useContext(UnlabeledDivisionsContext);
  if (divisions == null) return null;
  return h(UnitNamesColumn, { divisions, ...props });
}

function CompositeUnitsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const {
    columnWidth,
    width = 100,
    gutterWidth = 10,
    labelOffset = 30
  } = props;

  const { divisions } = useContext(ColumnContext);

  return h(LabelTrackerProvider, [
    h(LithologyColumn, { width: columnWidth }, [
      h(CompositeBoxes, {
        divisions
      })
    ]),
    h(UnlabeledUnitNames, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth
    })
  ]);
}

export { UnitNamesColumn, CompositeUnitsColumn, ICompositeUnitProps };
