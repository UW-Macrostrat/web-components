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
  useMacrostratTimescales,
  type Interval,
  type IntervalStyleBuilder,
  type TimescaleClickData,
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

/** A per-interval style that also knows which timescale the interval was
 * drawn from. The same interval often appears in several of the timescales
 * beside each other, and they aren't interchangeable — only one of them is
 * the one a selection was made in. */
export type ColumnIntervalStyleBuilder =
  | CSSProperties
  | ((interval: Interval, timescaleID: number) => CSSProperties)
  | null;

/** A timescale click, reporting which timescale was clicked in */
export type ColumnTimescaleClickHandler = (
  event: Event,
  data: TimescaleClickData & { timescaleID: number },
) => void;

/** A timescale to draw beside a column.
 *
 * The international timescale is one of these, not a special case: it is the
 * one that happens to be nested several levels deep. Anything with the same
 * shape can take its place or sit beside it — a regional set from the API, a
 * zonation assembled locally, or a hierarchy that isn't a timescale at all,
 * so long as its "intervals" carry ages.
 */
export interface ColumnTimescale {
  /** Integer identifier. Clicks and per-interval styles report it, so a
   * consumer can tell one column's copy of an interval from another's. For a
   * Macrostrat timescale it is the `timescale_id`. */
  id: number;
  /** Shown above the column, unless `label` says otherwise */
  name?: string;
  /** The intervals themselves, flat or already nested by `pid`. Left out,
   * the timescale `id` is fetched from the Macrostrat API. */
  intervals?: Interval[];
  /** Levels to draw, and so how many slots wide the column is (default
   * `[1, 1]`: one level, which is what a flat timescale has) */
  levels?: [number, number];
  /** `oid` of the interval the tree hangs from (default 0) */
  rootInterval?: number;
  /** Drawn above the column in place of the name — any node, so a consumer
   * can put a control or a legend there instead of text */
  label?: ReactNode;
}

export type ColumnTimescaleLike = number | ColumnTimescale;

interface CompositeTimescaleProps {
  /** Every timescale to draw, in order. A bare number is a Macrostrat
   * timescale to fetch and draw as a single level.
   *
   * Given this, `levels`, `timescaleID` and `additionalTimescales` are
   * ignored: it says what they say and more. */
  timescales?: ColumnTimescaleLike[];
  /** Levels of the ICS hierarchy to show. If a number, the finest level is
   * `levels[0]`, the second-finest is `levels[1]`, etc. If an array, the
   * first element is the starting level, the second is the ending level. */
  levels?: [number, number] | number;
  unconformityLabels?: boolean;
  onClickInterval?: ColumnTimescaleClickHandler;
  /** Per-interval style (e.g. to highlight the currently selected interval). */
  intervalStyle?: ColumnIntervalStyleBuilder;
  /** The timescale to draw. Defaults to the international one; any other
   * Macrostrat timescale (a regional or project-specific set of intervals)
   * can be drawn in its place. */
  timescaleID?: number;
  /** Further timescales drawn as extra level columns beside the main one,
   * against the same scale. Shorthand for listing them in `timescales`. */
  additionalTimescales?: number[];
  /** Draw the names above the columns. They sit above the column proper, so
   * leave top padding for them. */
  showLabels?: boolean;
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
};

/** What is drawn above a timescale: its name, reading up the page, or
 * whatever node the consumer gave instead. */
function TimescaleLabel({ timescale }: { timescale: ColumnTimescale }) {
  const { label, name } = timescale;
  const style = levelCountStyle(levelCount(timescale));

  let content: ReactNode = label;
  if (label == null && name != null) {
    content = h("span.timescale-label-text", name);
  }
  if (content == null) return h("div.timescale-label", { style });

  return h("div.timescale-label", { style }, content);
}

/** How wide a timescale draws: one slot per level it shows. */
function levelCountStyle(levelCount: number): CSSProperties {
  return { "--timescale-level-count": levelCount } as CSSProperties;
}

export function CompositeTimescaleCore(props: CompositeTimescaleCoreProps) {
  const {
    packages,
    unconformityLabels = false,
    onClickInterval,
    intervalStyle,
    showLabels = false,
    className,
  } = props;

  const timescales = useColumnTimescales(props);

  /** Clicks and styles carry the timescale they came from, so a consumer can
   * tell one column's copy of an interval from another's. */
  function forTimescale(id: number) {
    let onClick = null;
    if (onClickInterval != null) {
      onClick = (event: Event, data: TimescaleClickData) => {
        onClickInterval(event, { ...data, timescaleID: id });
      };
    }
    let style = intervalStyle as IntervalStyleBuilder;
    if (typeof intervalStyle === "function") {
      style = (interval: Interval) => intervalStyle(interval, id);
    }
    return { onClick, intervalStyle: style };
  }

  return h("div.timescale-column", { className }, [
    h.if(showLabels)(
      "div.timescale-labels",
      timescales.map((timescale) =>
        h(TimescaleLabel, { key: timescale.id, timescale }),
      ),
    ),
    h(
      "div.timescales",
      packages.map((group) => {
        const { pixelHeight, paddingTop, key, scale } = group;
        return h(
          "div.section-timescales",
          { style: { paddingTop }, key },
          timescales.map((timescale) =>
            h(Timescale, {
              key: timescale.id,
              orientation: TimescaleOrientation.VERTICAL,
              length: pixelHeight,
              levels: timescale.levels,
              rootInterval: timescale.rootInterval,
              absoluteAgeScale: true,
              showAgeAxis: false,
              scale,
              intervals: timescale.intervals,
              style: levelCountStyle(levelCount(timescale)),
              ...forTimescale(timescale.id),
            }),
          ),
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

/** The timescales to draw, with their intervals.
 *
 * Every timescale a column draws is fetched in one place: a column is split
 * into sections, and fetching per section would ask for the same timescale
 * once per section per timescale.
 */
function useColumnTimescales(props: CompositeTimescaleProps): ColumnTimescale[] {
  const { timescales, levels = 3, timescaleID, additionalTimescales } = props;

  const specs = useMemo(
    () => timescaleSpecs({ timescales, levels, timescaleID, additionalTimescales }),
    [
      timescales,
      levels,
      timescaleID,
      additionalTimescales?.join(","),
    ],
  );

  // Only the ones that didn't come with their own intervals need fetching
  const fetchIDs = useMemo(
    () => specs.filter((d) => d.intervals == null).map((d) => d.id),
    [specs],
  );
  const intervalSets = useMacrostratTimescales(fetchIDs);

  return useMemo(
    () =>
      specs.map((spec) => ({
        ...spec,
        intervals: spec.intervals ?? intervalSets.get(spec.id) ?? [],
      })),
    [specs, intervalSets],
  );
}

/** The `timescales` list, or one built from the older props that name the
 * leveled timescale and the flat ones beside it. */
function timescaleSpecs(props: CompositeTimescaleProps): ColumnTimescale[] {
  const { timescales, levels = 3, timescaleID, additionalTimescales = [] } = props;

  if (timescales != null) {
    return timescales.map(normalizeTimescale);
  }

  return [
    {
      id: timescaleID ?? INTERNATIONAL_TIMESCALE_ID,
      levels: levelRange(levels),
    },
    ...additionalTimescales.map(normalizeTimescale),
  ];
}

function normalizeTimescale(timescale: ColumnTimescaleLike): ColumnTimescale {
  if (typeof timescale === "number") {
    return { id: timescale, levels: FLAT_TIMESCALE_LEVELS };
  }
  return { levels: FLAT_TIMESCALE_LEVELS, ...timescale };
}

/** Regional and project timescales come back flat: one level of intervals. */
const FLAT_TIMESCALE_LEVELS: [number, number] = [1, 1];

function levelRange(levels: [number, number] | number): [number, number] {
  if (typeof levels !== "number") return levels;
  // A count, rather than a range: start at the level most columns start at
  return [2, Math.max(2 + Math.min(levels, 5) - 1, 1)];
}

/** How many slots wide a timescale draws: one per level it shows. */
function levelCount(timescale: ColumnTimescale): number {
  const [min, max] = timescale.levels ?? FLAT_TIMESCALE_LEVELS;
  return Math.max(max - min + 1, 1);
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
