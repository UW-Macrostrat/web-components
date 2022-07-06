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
import { BaseUnit } from "@macrostrat/api-types";
import { LabeledUnit, UnitBoxes } from "./boxes";
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
  const [unlabeledDivisions, setUnlabeledDivisions] = useState<
    BaseUnit[] | null
  >(null);
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
  nameForDivision?: (division: BaseUnit) => string;
  children?: React.ReactNode;
};

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
      trackLabelVisibility(division, visible);
    },
    ...rest
  });
}

function UnlabeledUnitNames(props) {
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
        ...rest
      })
    ]),
    children
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
    ...rest
  } = props;

  return h(
    _BaseUnitsColumn,
    {
      width: showLabels ? columnWidth : width,
      unitComponentProps: { nameForDivision }
    },
    [
      h.if(showLabels)(UnlabeledUnitNames, {
        transform: `translate(${columnWidth + gutterWidth})`,
        paddingLeft: labelOffset,
        width: width - columnWidth - gutterWidth,
        minimumHeight: minimumLabelHeight,
        nameForDivision,
        ...rest
      })
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
    showLabels = true,
    ...rest
  } = props;

  let { columnWidth } = props;
  if (!showLabels) {
    columnWidth = width;
  }

  return h(_BaseUnitsColumn, { width: columnWidth, ...rest }, [
    h.if(showLabels)(UnlabeledUnitNames, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth
    })
  ]);
}

export {
  UnitNamesColumn,
  CompositeUnitsColumn,
  AnnotatedUnitsColumn,
  TrackedLabeledUnit
};
