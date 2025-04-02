import { hyperStyled } from "@macrostrat/hyper";
import {
  LithologyColumn,
  ColumnLayoutContext,
} from "@macrostrat/column-components";
import { defaultNameFunction, UnitNamesColumn } from "./names";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { BaseUnit } from "@macrostrat/api-types";
import { LabeledUnit, UnitBoxes } from "./boxes";
import styles from "./composite.module.sass";

const h = hyperStyled(styles);

interface LabelTracker {
  [key: number]: boolean;
}

const LabelTrackerContext = createContext(null);
const UnlabeledDivisionsContext = createContext(null);

const findMacrostratUnitID = (u) => u.unit_id;

export function LabelTrackerProvider(props) {
  /** Tracker for units to handle state for whether their labels fit inline or not.
   * Designed to work for single or composite columns.
   */
  const { children, units, findUnitID = findMacrostratUnitID } = props;
  const [unlabeledDivisions, setUnlabeledDivisions] = useState<
    BaseUnit[] | null
  >(null);
  const labelTrackerRef = useRef<LabelTracker>({});
  const trackLabelVisibility = useCallback(
    (div, visible) => {
      const id = findUnitID(div);
      labelTrackerRef.current[id] = visible;
      if (Object.keys(labelTrackerRef.current).length == units.length) {
        setUnlabeledDivisions(
          // @ts-ignore
          units.filter((d) => {
            const id = findUnitID(d);
            return labelTrackerRef.current[id] == false;
          })
        );
      }
    },
    [labelTrackerRef, units, findUnitID]
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

function TrackedLabeledUnit({
  division,
  nameForDivision = defaultNameFunction,
  ...rest
}) {
  const trackLabelVisibility = useContext(LabelTrackerContext);
  return h(LabeledUnit, {
    division,
    //halfWidth: div.bottomOverlap,
    label: nameForDivision(division),
    onLabelUpdated(label, visible) {
      // If there is al LabelTrackerContext, update the label visibility
      trackLabelVisibility?.(division, visible);
    },
    ...rest,
  });
}

function UnlabeledUnitNames(props) {
  // Returns only unlabeled divisions
  const divisions = useContext(UnlabeledDivisionsContext);
  if (divisions == null) return null;
  return h(UnitNamesColumn, { divisions, ...props });
}

type BaseUnitProps = {
  width: number;
  showLabels?: boolean;
  columnWidth?: number;
  clipToFrame?: boolean;
};

type ICompositeUnitProps = BaseUnitProps & {
  gutterWidth?: number;
  labelOffset?: number;
  paddingLeft?: number;
  nameForDivision?: (division: BaseUnit) => string;
  children?: React.ReactNode;
  unitComponent?: React.FC<any>;
  unitComponentProps?: any;
  noteMode?: "labeled" | "unlabeled";
  showLabelColumn?: boolean;
  noteComponent?: React.FC<any>;
  shouldRenderNote?: (d: BaseUnit) => boolean;
};

interface CompositeUnitProps {
  unitComponent: React.FC<any>;
  unitComponentProps?: any;
  width: number;
  showLabels: boolean;
  cliptoFrame: boolean;
}

export function CompositeUnitsColumn(props: CompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const {
    width,
    unitComponent = TrackedLabeledUnit,
    unitComponentProps,
    clipToFrame,
    ...rest
  } = props;

  return h(LithologyColumn, { width, clipToFrame }, [
    h(UnitBoxes, {
      unitComponent,
      unitComponentProps,
      ...rest,
    }),
  ]);
}

export function CompositeLabelsColumn(props: ICompositeUnitProps) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const {
    width = 100,
    labelOffset = 30,
    // Which units to show labels for
    noteMode = "unlabeled",
    noteComponent,
    shouldRenderNote,
  } = props;

  const labelColumnComponent =
    noteMode == "unlabeled" ? UnlabeledUnitNames : UnitNamesColumn;

  return h(labelColumnComponent, {
    paddingLeft: labelOffset,
    width,
    noteComponent,
    shouldRenderNote,
  });
}

export function CompositeUnitComponent({ division, nColumns = 2, ...rest }) {
  // This comes from CompositeUnits
  const { width } = useContext(ColumnLayoutContext);

  //const nCols = Math.min(nColumns, division.overlappingUnits.length+1)
  //console.log(division);
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: division.overlappingUnits.length > 0 ? width / nColumns : width,
    x: (division.column * width) / nColumns,
  });
}

export { TrackedLabeledUnit, ICompositeUnitProps };
