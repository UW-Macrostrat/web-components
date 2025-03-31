import {
  ColumnAxisType,
  ColumnLayoutContext,
} from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { useDarkMode, useInDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import {
  createRef,
  forwardRef,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import styles from "./column.module.sass";
import {
  getMixedUnitColor,
  IUnit,
  TrackedLabeledUnit,
  UnitKeyboardNavigation,
  UnitSelectionProvider,
  useUnitSelectionDispatch,
} from "./units";
import { SectionInfo } from "./section";
import { UnitSelectionPopover } from "./selection-popover";
import { MacrostratUnitsProvider } from "./store";
import { IColumnProps, Section } from "./section";
import {
  _mergeOverlappingSections,
  ensureArray,
  groupUnitsIntoSections,
} from "./helpers";
import { useLithologies } from "./data-provider";
import { VerticalAxisLabel } from "./age-axis";

const h = hyperStyled(styles);

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);

  const nOverlappingUnits = division.overlappingUnits?.length ?? 0;
  const columnIx = (division.column ?? 0) % nColumns;

  //const nCols = Math.min(nColumns, division.overlappingUnits.length+1)
  //console.log(division);
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: nOverlappingUnits > 0 ? width / nColumns : width,
    x: (columnIx * width) / nColumns,
  });
}

export function ColoredUnitComponent(props) {
  /** A unit component that is colored using a mixture of lithologies.
   * This is a separate component because it depends on more providers/contexts to determine coloring. */
  const lithMap = useLithologies();
  const inDarkMode = useInDarkMode();
  return h(UnitComponent, {
    ...props,
    backgroundColor: getMixedUnitColor(props.division, lithMap, inDarkMode),
  });
}

function Unconformity({ upperUnits = [], lowerUnits = [], style }) {
  if (upperUnits.length == 0 || lowerUnits.length == 0) {
    return null;
  }

  const ageGap = lowerUnits[0].t_age - upperUnits[upperUnits.length - 1].b_age;

  return h("div.unconformity", { style }, [
    h("div.unconformity-text", `${ageGap.toFixed(1)} Ma`),
  ]);
}

interface BaseColumnProps extends IColumnProps {
  unconformityLabels?: boolean;
  className?: string;
  mergeOverlappingSections?: boolean;
  showLabelColumn?: boolean;
  columnRef?: RefObject<HTMLElement>;
  keyboardNavigation?: boolean;
  t_age?: number;
  b_age?: number;
  axisType?: ColumnAxisType;
  unitComponent?: any;
  showLabels?: boolean;
  data: IUnit[];
  maxInternalColumns?: number;
  clipUnits?: boolean;
}

export interface ColumnProps extends BaseColumnProps {
  showUnitPopover?: boolean;
  selectedUnit?: number | null;
  onUnitSelected?: (unitID: number | null, unit: any) => void;
}

export function Column(props: ColumnProps) {
  const {
    showUnitPopover = false,
    keyboardNavigation = false,
    mergeOverlappingSections = true,
    onUnitSelected,
    selectedUnit,
    children,
    data,
    axisType,
    ...rest
  } = props;
  const ref = useRef<HTMLElement>();
  // Selected item position

  const [sectionGroups, units] = useMemo(() => {
    let res = groupUnitsIntoSections(data, axisType);
    /** Merging overlapping sections really only makes sense for age/height/depth
     * columns. Ordinal columns are numbered by section so merging them
     * results in collisions.
     */
    if (mergeOverlappingSections && axisType != ColumnAxisType.ORDINAL) {
      res = _mergeOverlappingSections(res);
    }

    /** Reconstitute the units so that they are sorted by section.
     * This is mostly important so that unit keyboard navigation
     * predictably selects adjacent units.
     */
    const units = res.reduce((acc, group) => {
      const { units } = group;
      for (const unit of units) {
        acc.push(unit);
      }
      return acc;
    }, []);

    return [res, units];
  }, [data, mergeOverlappingSections, axisType]);

  return h(
    UnitSelectionProvider,
    { columnRef: ref, onUnitSelected, selectedUnit, units },
    h(
      ColumnInner,
      { columnRef: ref, data: units, axisType, sectionGroups, ...rest },
      [
        children,
        h.if(showUnitPopover)(UnitSelectionPopover),
        h.if(keyboardNavigation)(UnitKeyboardNavigation, { units }),
      ]
    )
  );
}

interface ColumnInnerProps extends BaseColumnProps {
  sectionGroups: SectionInfo[];
}

function ColumnInner(props: ColumnInnerProps) {
  const {
    data,
    sectionGroups,
    unitComponent = UnitComponent,
    unitComponentProps,
    maxInternalColumns,
    unconformityLabels = true,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    className: baseClassName,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    columnRef,
    clipUnits = false,
    children,
    ...rest
  } = props;

  const darkMode = useDarkMode();

  const className = classNames(baseClassName, {
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  const _unitComponentProps = useMemo(() => {
    return {
      // We allow internal columns at minimum ~10 px wide
      nColumns: maxInternalColumns ?? Math.floor(columnWidth / 10),
      ...unitComponentProps,
    };
  }, [unitComponentProps, maxInternalColumns, columnWidth]);

  // Clear unit selection on click outside of units, if we have a dispatch function
  const dispatch = useUnitSelectionDispatch();

  let axisLabel: string | null = "Age";
  let axisUnit = "Ma";
  if (axisType == ColumnAxisType.DEPTH) {
    axisLabel = "Depth";
    axisUnit = "m";
  } else if (axisType == ColumnAxisType.HEIGHT) {
    axisLabel = "Height";
    axisUnit = "m";
  } else if (axisType == ColumnAxisType.ORDINAL) {
    axisLabel = null;
  }

  return h(
    "div.column-container",
    {
      className,
      // TODO: this could probably be done using the columnRef
      onClick(evt) {
        dispatch?.(null, null, evt as any);
      },
    },
    h(MacrostratUnitsProvider, { units: data }, [
      h("div.column", { ref: columnRef }, [
        h.if(axisLabel != null)(VerticalAxisLabel, {
          label: axisLabel,
          unit: axisUnit,
        }),
        h(
          "div.main-column",
          sectionGroups.map((group, i) => {
            const { section_id: id, units: data } = group;
            const lastGroup = sectionGroups[i - 1];
            return h(
              Section,
              {
                data,
                key: id,
                unitComponent,
                unitComponentProps: _unitComponentProps,
                showLabels,
                width,
                columnWidth,
                showLabelColumn,
                axisType,
                clipUnits,
                ...rest,
              },
              h.if(unconformityLabels)(Unconformity, {
                upperUnits: lastGroup?.units,
                lowerUnits: data,
                style: { width: showLabels ? columnWidth : width },
              })
            );
          })
        ),
        children,
      ]),
    ])
  );
}
