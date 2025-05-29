import { hyperStyled } from "@macrostrat/hyper";
import {
  LithologyColumn,
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
  useEffect,
} from "react";
import { BaseUnit } from "@macrostrat/api-types";
import { LabeledUnit, UnitBoxes } from "./boxes";
import styles from "./composite.module.sass";
import { useMacrostratColumnData } from "../data-provider";

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
      "AnnotatedUnitsColumn is deprecated and currently renders a no-op for transition purposes"
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

  const { sections, totalHeight, axisType } = useMacrostratColumnData();

  const unlabeledUnits = useContext(UnlabeledDivisionsContext);
  const unitsToLabel = noteMode == "unlabeled" ? unlabeledUnits : undefined;

  const _compositeScale = compositeScale(sections);

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
        })
      )
    ),
  ]);
}

type CompositeScaleOpts = {
  clamped?: boolean;
};

export interface CompositeColumnScale {
  (val: number): number;
  copy(): CompositeColumnScale;
  domain(): number[];
}

export function compositeScale(
  sections,
  opts: CompositeScaleOpts = {}
): CompositeColumnScale {
  /** A basic composite scale that works across all sections. This isn't a fully featured,
   * contiuous D3 scale, but it shares enough attributes to be useful for
   * laying out notes.
   */
  const { clamped = true } = opts;

  const scales = sections.map((group) => {
    const { scaleInfo } = group;
    return scaleInfo.scale.copy().clamp(clamped);
  });

  let baseScale: any = (val) => {
    // Find the scale for the section that contains the value
    const scale = scales.find((scale) => {
      return scale.domain()[0] <= val && val <= scale.domain()[1];
    });

    if (scale) {
      return scale(val);
    } else {
      // return nan
      return NaN;
    }
  };

  baseScale.copy = () => {
    return baseScale;
  };

  baseScale.domain = () => {
    // Return a domain that covers all sections
    return [scales[0].domain()[0], scales[scales.length - 1].domain()[1]];
  };

  return baseScale as CompositeColumnScale;
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
    children
  );
}

export { TrackedLabeledUnit, ICompositeUnitProps };
