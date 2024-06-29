import { hyperStyled } from "@macrostrat/hyper";
import {
  LithologyColumn,
  useColumn,
  useColumnDivisions,
  ColumnLayoutContext,
} from "@macrostrat/column-components";
import { defaultNameFunction, UnitNamesColumn, UnitDataColumn } from "./names";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  memo,
} from "react";
import { BaseUnit } from "/Users/Daven/Projects/Macrostrat/Software/web/deps/web-components/packages/api-types/src";
import { LabeledUnit, UnitBoxes } from "./boxes";
import styles from "./composite.module.scss";

const h = hyperStyled(styles);

interface LabelTracker {
  [key: number]: boolean;
}

const LabelTrackerContext = createContext(null);
const UnlabeledDivisionsContext = createContext(null);

function LabelTrackerProvider(props) {
  const { children } = props;
  const { divisions } = useColumn();
  const [unlabeledDivisions, setUnlabeledDivisions] = useState<
    BaseUnit[] | null
  >(null);
  const labelTrackerRef = useRef<LabelTracker>({});
  const trackLabelVisibility = useCallback(
    (div, visible) => {
      labelTrackerRef.current[div.unit_id] = visible;
      if (Object.keys(labelTrackerRef.current).length == divisions.length) {
        setUnlabeledDivisions(
          divisions.filter((d) => labelTrackerRef.current[d.unit_id] == false)
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

type ICompositeUnitProps = BaseUnitProps & {
  gutterWidth?: number;
  labelOffset?: number;
  nameForDivision?: (division: BaseUnit) => string;
  children?: React.ReactNode;
  unitComponent?: React.FC<any>;
  unitComponentProps?: any;
};

function TrackedLabeledUnit({
  division,
  nameForDivision = defaultNameFunction,
  axisType,
  ...rest
}) {
  const trackLabelVisibility = useContext(LabelTrackerContext);
  return h(LabeledUnit, {
    division,
    //halfWidth: div.bottomOverlap,
    label: nameForDivision(division),
    onLabelUpdated(label, visible) {
      trackLabelVisibility(division, visible);
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

function _BaseUnitsColumn(
  props: React.PropsWithChildren<{
    width: number;
    unitComponent?: React.FC<any>;
    unitComponentProps?: any;
  }>
) {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const {
    width,
    children,
    unitComponent = TrackedLabeledUnit,
    unitComponentProps,
    ...rest
  } = props;

  return h(LabelTrackerProvider, [
    h(LithologyColumn, { width }, [
      h(UnitBoxes, {
        unitComponent,
        unitComponentProps,
        ...rest,
      }),
    ]),
    children,
  ]);
}

type AnnotatedUnitProps = ICompositeUnitProps & { minimumLabelHeight?: number };

function AnnotatedUnitsColumn(props: AnnotatedUnitProps) {
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
    nameForDivision,
    minimumLabelHeight = 0,
    axisType,
    ...rest
  } = props;

  return h(
    _BaseUnitsColumn,
    {
      width: showLabels ? columnWidth : width,
      unitComponentProps: { nameForDivision },
    },
    [
      h.if(showLabels)(UnlabeledUnitNames, {
        transform: `translate(${columnWidth + gutterWidth})`,
        paddingLeft: labelOffset,
        width: width - columnWidth - gutterWidth,
        minimumHeight: minimumLabelHeight,
        nameForDivision,
        ...rest,
      }),
      // h(UnitDataColumn, {
      //   transform: `translate(${columnWidth + gutterWidth})`,
      //   paddingLeft: labelOffset,
      //   width: width - columnWidth - gutterWidth,
      //   ...rest
      // })
    ]
  );
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
    noteMode = "unlabeled",
    showLabels = true,
    noteComponent,
    shouldRenderNote,
    ...rest
  } = props;

  let { columnWidth = width } = props;

  const labelColumnComponent =
    noteMode == "unlabeled" ? UnlabeledUnitNames : UnitNamesColumn;

  return h(_BaseUnitsColumn, { width: columnWidth, ...rest }, [
    h(ColumnLabel, {
      showLabels,
      component: labelColumnComponent,
      columnWidth,
      gutterWidth,
      labelOffset,
      width,
      noteComponent,
      showNote: shouldRenderNote,
    }),
  ]);
}

function _ColumnLabel(props) {
  const {
    showLabels,
    component,
    columnWidth,
    gutterWidth,
    labelOffset,
    width,
    noteComponent,
    showNote,
  } = props;
  if (!showLabels) return null;
  return h(component, {
    transform: `translate(${columnWidth + gutterWidth})`,
    paddingLeft: labelOffset,
    width: width - columnWidth - gutterWidth,
    noteComponent,
    shouldRenderNote: showNote,
  });
}

const ColumnLabel = memo(_ColumnLabel);

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

export {
  UnitNamesColumn,
  CompositeUnitsColumn,
  AnnotatedUnitsColumn,
  TrackedLabeledUnit,
  ICompositeUnitProps,
};
