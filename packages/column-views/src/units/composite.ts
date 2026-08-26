import { hyperStyled } from "@macrostrat/hyper";
import {
  ColumnContext,
  LithologyColumn,
  SVG,
} from "@macrostrat/column-components";
import { defaultNameFunction, UnitNamesColumn } from "./names";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BaseUnit } from "@macrostrat/api-types";
import { LabeledUnit, UnitBoxes } from "./boxes";
import styles from "./composite.module.sass";
import {
  useCompositeScale,
  useMacrostratColumnData,
  useUnitSelectionDispatch,
} from "../data-provider";

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

  const recompute = useCallback(() => {
    // Recompute over the *current* unit set (which changes as the column zooms).
    // The tracker ref accumulates entries for units seen at any zoom level, so
    // we gate on whether every currently-visible unit has reported — not on the
    // total number of tracked units, which would go stale and freeze the notes.
    const tracker = labelTrackerRef.current;
    const allReported = units.every((d) => findUnitID(d) in tracker);
    if (!allReported) return;
    setUnlabeledDivisions(units.filter((d) => tracker[findUnitID(d)] === false));
  }, [units, findUnitID]);

  const trackLabelVisibility = useCallback(
    (div, visible) => {
      labelTrackerRef.current[findUnitID(div)] = visible;
      recompute();
    },
    [recompute, findUnitID],
  );

  // Re-sync when the visible unit set changes (e.g. on zoom), so a unit whose
  // label now fits inline stops also rendering as a note, and vice versa.
  useEffect(() => {
    recompute();
  }, [recompute]);

  const value = trackLabelVisibility;
  return h(
    LabelTrackerContext.Provider,
    { value },
    h(
      UnlabeledDivisionsContext.Provider,
      { value: unlabeledDivisions },
      children,
    ),
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
    label: nameForDivision(division),
    onLabelUpdated(label, visible) {
      // If there is al LabelTrackerContext, update the label visibility
      trackLabelVisibility?.(division, visible);
    },
    ...rest,
  });
}

export const CompositeUnitComponent = TrackedLabeledUnit;

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
  shouldRenderNote?: (d: any) => boolean;
};

interface CompositeUnitProps {
  unitComponent: React.FC<any>;
  unitComponentProps?: any;
  width: number;
  showLabels?: boolean;
  clipToFrame?: boolean;
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

export function AnnotatedUnitsColumn(props: ICompositeUnitProps) {
  useEffect(() => {
    console.warn(
      "AnnotatedUnitsColumn is deprecated and currently renders a no-op for transition purposes",
    );
  }, []);
  return null;
}

export function SectionLabelsColumn(props: ICompositeUnitProps) {
  // Section with "squishy" time scale
  const {
    width = 300,
    noteMode = "unlabeled",
    labelOffset = 30,
    noteComponent,
    shouldRenderNote,
  } = props;

  const { totalHeight, axisType } = useMacrostratColumnData();
  const _compositeScale = useCompositeScale();

  const unlabeledUnits = useContext(UnlabeledDivisionsContext);
  const unitsToLabel = noteMode == "unlabeled" ? unlabeledUnits : undefined;

  const selectUnit = useUnitSelectionDispatch();

  return h("div.section-labels-column", [
    h(
      ColumnNotesProvider,
      {
        units: [],
        scale: _compositeScale,
        totalHeight,
        axisType,
      },
      h(
        SVG,
        {
          height: totalHeight,
          innerWidth: width - 4,
          paddingH: 1,
          paddingLeft: 3,
        },
        h(UnitNamesColumn, {
          divisions: unitsToLabel,
          paddingLeft: labelOffset,
          width,
          noteComponent,
          shouldRenderNote,
          scale: _compositeScale,
          onClickNote(note) {
            selectUnit(note.data, null, null);
          },
        }),
      ),
    ),
  ]);
}

export function ColumnNotesProvider(props) {
  // A fake column axis provider that allows scales to cross
  const { children, scale, totalHeight, pixelScale } = props;

  const { axisType } = useMacrostratColumnData();

  return h(
    ColumnContext.Provider,
    {
      value: {
        divisions: [],
        scale,
        scaleClamped: scale,
        pixelHeight: totalHeight,
        pixelsPerMeter: pixelScale,
        axisType,
        zoom: 1,
      },
    },
    children,
  );
}

export { TrackedLabeledUnit, ICompositeUnitProps };
