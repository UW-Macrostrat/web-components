import { hyperStyled } from "@macrostrat/hyper";
import {
  LithologyColumn,
  ColumnLayoutContext,
  ColumnAxisType,
  SVG,
  ColumnContext,
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
import { MacrostratColumnProvider } from "@macrostrat/column-views";
import { SectionProps } from "../section";

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

export function SectionLabelsColumn(props: ICompositeUnitProps) {
  // Section with "squishy" time scale
  const {
    sections,
    totalHeight,
    width = 300,
    axisType = ColumnAxisType.AGE,
    noteMode = "unlabeled",
    labelOffset = 30,
    noteComponent,
    shouldRenderNote,
  } = props;

  const unlabeledUnits = useContext(UnlabeledDivisionsContext);
  const unitsToLabel = noteMode == "unlabeled" ? unlabeledUnits : undefined;

  return h("div.section-labels-column", [
    h(
      SVG,
      {
        height: totalHeight,
        innerWidth: width - 4,
        paddingH: 1,
        paddingLeft: 3,
      },
      sections.map((group, i) => {
        const { scaleInfo, section_id } = group;
        const { domain, pixelScale, scale, totalHeight } = scaleInfo;

        const key = `section-${section_id}`;
        return h(
          "g.section",
          {
            key,
            //transform: `translate(0 ${scaleInfo.offset})`,
          },
          [
            h(
              ColumnNotesProvider,
              // {
              //   units: [],
              //   domain,
              //   pixelScale, // Actually pixels per myr,
              //   axisType,
              // },
              {
                units: [],
                scale,
                totalHeight,
                pixelScale, // Actually pixels per myr,
                axisType,
              },
              h(UnitNamesColumn, {
                divisions: unitsToLabel,
                paddingLeft: labelOffset,
                width,
                noteComponent,
                shouldRenderNote,
                scale,
              })
            ),
          ]
        );
      })
    ),
  ]);
}

function ColumnNotesProvider(props) {
  const { children, scale, totalHeight, pixelScale, axisType } = props;

  return h(
    ColumnContext.Provider,
    {
      value: {
        divisions: [],
        scale,
        scaleClamped: scale.copy().clamp(true),
        pixelHeight: totalHeight,
        pixelsPerMeter: pixelScale,
        axisType,
      },
    },
    children
  );
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
