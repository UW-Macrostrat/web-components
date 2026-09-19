import {
  CompositeUnitsColumn,
  LabelTrackerProvider,
  SectionLabelsColumn,
} from "./units";
import {
  type CSSProperties,
  ReactNode,
  FunctionComponent,
  useMemo,
} from "react";
import {
  Timescale,
  TimescaleOrientation,
  TimescaleClickHandler,
  useMacrostratTimescales,
  type Interval,
  type IntervalStyleBuilder,
} from "@macrostrat/timescale";

/** Macrostrat's international timescale, the default for a column */
const INTERNATIONAL_TIMESCALE_ID = 11;
import { ColumnAxisType, SVG } from "@macrostrat/column-components";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import {
  useMacrostratColumnData,
  useMacrostratUnits,
  MacrostratColumnProvider,
} from "./data-provider";
import { Duration } from "./unit-details";
import { Value } from "@macrostrat/data-components";
import type { ExtUnit, PackageScaleLayoutData } from "./prepare-units/types";

const h = hyper.styled(styles);

export interface SectionSharedProps {
  unitComponent?: FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  children?: ReactNode;
  showLabelColumn?: boolean;
  axisType?: ColumnAxisType;
  className?: string;
  clipUnits?: boolean;
  maxInternalColumns?: number;
  // Space between sections
  verticalSpacing?: number;
  // Whether to render unconformity labels
  unconformityLabels?: boolean;
}

export interface SectionProps extends SectionSharedProps {
  units: ExtUnit[];
  scaleInfo: PackageScaleLayoutData;
}

export function SectionsColumn(props: SectionSharedProps) {
  const {
    unconformityLabels = true,
    unitComponent,
    unitComponentProps,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    showLabelColumn = true,
    clipUnits = true,
    maxInternalColumns,
  } = props;

  const units = useMacrostratUnits();

  // Get a unique key for the column
  const key = units[0]?.col_id;

  return h(LabelTrackerProvider, { units, key }, [
    h(SectionUnitsColumn, {
      width: columnWidth,
      unitComponent,
      unitComponentProps,
      showLabels,
      clipUnits,
      maxInternalColumns,
      unconformityLabels,
    }),
    h.if(showLabelColumn)(SectionLabelsColumn, {
      width: width - columnWidth,
    }),
  ]);
}

function SectionUnitsColumn(props: SectionSharedProps) {
  const {
    width,
    showLabels,
    unitComponent,
    unitComponentProps,
    clipUnits,
    maxInternalColumns,
    axisType,
    unconformityLabels = true,
  } = props;

  const { sections, totalHeight } = useMacrostratColumnData();

  const scaleData: PackageScaleLayoutData[] = sections.map((section) => {
    return section.scaleInfo;
  });

  const innerWidth = width - 2;

  return h("div.section-units-container", { style: { width } }, [
    h(
      SVG,
      {
        className: "sections",
        height: totalHeight,
        innerWidth,
        paddingH: 1,
      },
      sections.map((group) => {
        const { units, scaleInfo, section_id } = group;

        const key = `section-${section_id}`;
        return h(
          SectionUnits,
          {
            units,
            scaleInfo,
            key,
            unitComponent,
            unitComponentProps,
            showLabels,
            width: innerWidth,
            clipUnits,
            maxInternalColumns,
          }, // This unconformity is with the section _above_
        );
      }),
    ),
    h.if(unconformityLabels)(UnconformityLabels, {
      width,
      sections: scaleData,
      verbose: false,
    }),
  ]);
}

function SectionUnits(props: SectionProps) {
  // Section with "squishy" timescale
  const {
    units,
    scaleInfo,
    unitComponent,
    showLabels = true,
    width = 300,
    unitComponentProps,
    className,
    clipUnits = true,
    maxInternalColumns,
  } = props;

  const { domain, pixelScale, pixelHeight, scale } = scaleInfo;

  /** Ensure that we can arrange units into the maximum number
   * of columns defined by unitComponentProps, but that we don't
   * use more than necessary.
   */
  const _unitComponentProps = useMemo(() => {
    return {
      ...unitComponentProps,
      nColumns: Math.min(
        maxInternalColumns ?? Math.floor(width / 10),
        unitComponentProps?.nColumns ?? Infinity,
      ),
      //axisType,
    };
  }, [units, unitComponentProps, maxInternalColumns, width]);

  const style = {
    "--section-height": `${pixelHeight}px`,
    "--section-width": `${width}px`,
  };

  return h(
    "g.section",
    { className, style, transform: `translate(0 ${scaleInfo.offset})` },
    h(
      MacrostratColumnProvider,
      {
        units,
        domain,
        pixelScale, // Actually pixels per myr,
        scale,
      },
      h(CompositeUnitsColumn, {
        width,
        showLabels,
        unitComponent,
        unitComponentProps: _unitComponentProps,
        clipToFrame: clipUnits,
      }),
    ),
  );
}

interface CompositeTimescaleProps {
  levels?: [number, number] | number;
  unconformityLabels?: boolean;
  onClickInterval?: TimescaleClickHandler;
  /** Per-interval style (e.g. to highlight the currently selected interval). */
  intervalStyle?: IntervalStyleBuilder;
  /** The timescale to draw. Defaults to the international one; any other
   * Macrostrat timescale (a regional or project-specific set of intervals)
   * can be drawn in its place. */
  timescaleID?: number;
  /** Further timescales drawn as extra level columns beside the main one,
   * against the same scale. Regional and project timescales are flat — one
   * level of intervals — so each adds a single column. Pair this with a
   * narrower `levels` window to *replace* the finest level rather than widen
   * the timescale. */
  additionalTimescales?: number[];
  className?: string;
}

export function CompositeTimescale(props: CompositeTimescaleProps) {
  const { sections } = useMacrostratColumnData();
  const sectionScales = sections.map((section) => {
    return section.scaleInfo;
  });

  return h(CompositeTimescaleCore, {
    packages: sectionScales,
    ...props,
  });
}

type CompositeTimescaleCoreProps = CompositeTimescaleProps & {
  packages: PackageScaleLayoutData[];
  onClickInterval?: TimescaleClickHandler;
};

/** One more timescale beside the leveled one, sharing its scale so the two
 * line up. Regional and project timescales come back flat, so this draws a
 * single column of intervals. */
function AdditionalTimescale(props: {
  intervals: Interval[];
  length: number;
  scale: any;
  onClickInterval?: TimescaleClickHandler;
  intervalStyle?: IntervalStyleBuilder;
}) {
  const { intervals, length, scale, onClickInterval, intervalStyle } = props;

  return h(Timescale, {
    orientation: TimescaleOrientation.VERTICAL,
    length,
    levels: [1, 1],
    absoluteAgeScale: true,
    showAgeAxis: false,
    scale,
    intervals,
    onClick: onClickInterval,
    intervalStyle,
    // A flat timescale is one column wide
    style: levelCountStyle(1),
  });
}

/** How wide a timescale draws: one slot per level it shows. */
function levelCountStyle(levelCount: number): CSSProperties {
  return { "--timescale-level-count": levelCount } as CSSProperties;
}

export function CompositeTimescaleCore(props: CompositeTimescaleCoreProps) {
  const {
    levels = 3,
    packages,
    unconformityLabels = false,
    onClickInterval,
    intervalStyle,
    timescaleID,
    additionalTimescales = [],
    className,
  } = props;

  // Every timescale drawn here is fetched in one place: a column is split into
  // sections, and fetching per section would ask for the same timescale once
  // per section per extra timescale.
  const mainTimescaleID = timescaleID ?? INTERNATIONAL_TIMESCALE_ID;
  const timescaleIDs = useMemo(
    () => [mainTimescaleID, ...additionalTimescales],
    [mainTimescaleID, additionalTimescales.join(",")],
  );
  const intervalSets = useMacrostratTimescales(timescaleIDs);
  const intervals = intervalSets.get(mainTimescaleID) ?? [];

  let _levels: [number, number];
  if (typeof levels === "number") {
    // If levels is a number, use the most common starting level
    _levels = [2, Math.max(2 + Math.min(levels, 5) - 1, 1)];
  } else {
    _levels = levels;
  }

  // Each timescale sizes itself from its own level count. The count can't live
  // on the container they share, because custom properties inherit: set there,
  // every timescale inside would take the full width of all of them.
  const mainLevelCount = _levels[1] - _levels[0] + 1;

  return h("div.timescale-column", { className }, [
    h(
      "div.timescales",
      packages.map((group) => {
        const { pixelHeight, paddingTop, key, scale } = group;
        return h(
          "div.section-timescales",
          { style: { paddingTop }, key },
          [
            h(Timescale, {
              orientation: TimescaleOrientation.VERTICAL,
              length: pixelHeight,
              levels: _levels,
              absoluteAgeScale: true,
              showAgeAxis: false,
              scale,
              intervals,
              onClick: onClickInterval,
              intervalStyle,
              style: levelCountStyle(mainLevelCount),
            }),
            ...additionalTimescales.map((id) =>
              h(AdditionalTimescale, {
                key: id,
                intervals: intervalSets.get(id) ?? [],
                length: pixelHeight,
                scale,
                onClickInterval,
                intervalStyle,
              }),
            ),
          ],
        );
      }),
    ),
    h.if(unconformityLabels)(UnconformityLabels, {
      width: "100%",
      sections: packages,
      className: "unconformity-labels",
      axisType: ColumnAxisType.AGE,
    }),
  ]);
}

export function UnconformityLabels(props: {
  width: string | number;
  sections: PackageScaleLayoutData[];
  axisType?: ColumnAxisType;
  className?: string;
  verbose?: boolean;
}) {
  const { width, sections, className, axisType, verbose } = props;

  return h(
    "div.unconformity-labels",
    {
      style: {
        width,
      },
      className,
    },
    sections.map((scaleInfo, i) => {
      const lastGroup = sections[i - 1];
      const top = scaleInfo.offset - scaleInfo.paddingTop;
      const upperAge = lastGroup?.domain[0];
      const lowerAge = scaleInfo.domain[1];
      return h(Unconformity, {
        axisType,
        upperAge,
        lowerAge,
        style: {
          width,
          height: scaleInfo.paddingTop,
          top,
        },
        verbose,
      });
    }),
  );
}

function Unconformity({
  upperAge,
  lowerAge,
  style,
  axisType,
  verbose = false,
}) {
  if (upperAge == null || lowerAge == null) {
    return null;
  }

  const ageGap = Math.abs(upperAge - lowerAge);

  let maximumFractionDigits = 0;

  let className: string = null;
  if (ageGap > 1000) {
    className = "giga";
  } else if (ageGap > 100) {
    className = "mega";
  } else if (ageGap > 10) {
    className = "large";
  } else if (ageGap < 1) {
    className = "small";
    maximumFractionDigits = 2;
  } else {
    maximumFractionDigits = 1;
  }

  let val: ReactNode;
  if (axisType === ColumnAxisType.DEPTH || axisType === ColumnAxisType.HEIGHT) {
    const _txt = ageGap.toLocaleString("en-US", { maximumFractionDigits });
    val = h(Value, { value: _txt, unit: "m" });
  } else {
    val = h(Duration, { value: ageGap, maximumFractionDigits });
  }

  let prefix: ReactNode = null;
  if (verbose) {
    prefix = h([" ", h("span.prefix", " gap")]);
  }

  return h("div.unconformity", { style, className }, [
    h("div.unconformity-inner", h("div.unconformity-text", [val, prefix])),
  ]);
}
