import {
  ColumnAxisType,
  ColumnContext,
  ColumnLayoutContext,
  ClippableRect,
  ForeignObject,
  PatternDefsProvider,
  useColumn,
  useGeologicPattern,
} from "@macrostrat/column-components";
import { SizeAwareLabel, Clickable } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { ReactNode, useContext, useMemo } from "react";
import { useHasUnitSelection, useUnitSelectionTarget } from "../data-provider";
import { useLithologies } from "@macrostrat/data-provider";
import { IUnit } from "./types";
import styles from "./boxes.module.sass";
import classNames from "classnames";
import { getUnitHeightRange } from "../prepare-units/utils";
import type { RectBounds } from "./types";
import {
  getBestFGDCPatternForUnit,
  scalePattern,
  getMixedUnitColor,
} from "@macrostrat/stratigraphy-utils";

const h = hyper.styled(styles);

/** Resolve a class name through this file's CSS module exactly as the styled
 * `h` would (module-scoped classes are hashed; unknown/global classes pass
 * through). Needed because `ClippableRect` renders the element in
 * `@macrostrat/column-components`, so class resolution must happen here. */
const cls = (name: string): string => (styles as any)[name] ?? name;

interface UnitRectOptions {
  widthFraction?: number;
  axisType?: ColumnAxisType;
  // Padding to create overflow for zig-zags or other ornamented edges
  padding?: number;
}

/** How a unit shows that it is selected. Pass it to a unit component (e.g.
 * through a column's `unitComponentProps`). */
export enum UnitSelectionStyle {
  /** A wash of the selection color over the unit, and an outline (default) */
  Overlay = "overlay",
  /** An outline in the selection color */
  Outline = "outline",
  /** An outline, with the units that aren't selected faded */
  DimOthers = "dim-others",
  /** An outline, with the units that aren't selected drawn without their
   * background color */
  ColorSelected = "color-selected",
}

interface UnitProps extends Clickable, Partial<RectBounds>, UnitRectOptions {
  division: IUnit;
  resolveID?(IUnit): string;
  UUID?: string;
  defaultFill?: string;
  widthFraction?: number;
  children?: ReactNode;
  className?: string;
  fill?: string;
  backgroundColor?: string;
  patternColor?: string;
  patternID?: string | number;
  selectionStyle?: UnitSelectionStyle | `${UnitSelectionStyle}`;
}

export interface LabeledUnitProps
  extends UnitRectOptions, Clickable, Partial<RectBounds> {
  division: IUnit;
  patternID?: string | number;
  label: string;
  onLabelUpdated?(label: string, shown: boolean);
  halfWidth?: boolean;
  showLabel?: boolean;
  backgroundColor?: string;
  selectionStyle?: UnitSelectionStyle | `${UnitSelectionStyle}`;
}

function useUnitRect(
  division: IUnit,
  options: UnitRectOptions = {},
): RectBounds {
  const {
    widthFraction = 1,
    axisType = ColumnAxisType.AGE,
    padding = 0,
  } = options;
  const { scale } = useContext(ColumnContext);
  const { width } = useContext(ColumnLayoutContext);

  const [bottomHeight, topHeight] = getUnitHeightRange(division, axisType);

  const y = scale(topHeight);
  const height = Math.abs(scale(bottomHeight) - y);

  return {
    x: width * (1 - widthFraction) - padding,
    y: y - padding,
    height: height + padding * 2,
    width: widthFraction * width + padding * 2,
  };
}

export function MinimalUnit(props) {
  const {
    division: d,
    children,
    className,
    widthFraction = 1,
    axisType: _, // not sure why this is brought in...
    nColumns: __,
    selectionStyle,
    ...baseBounds
  } = props;

  const { axisType } = useColumn();
  const lithMap = useLithologies();
  const bounds = {
    ...useUnitRect(d, { widthFraction, axisType }),
    ...baseBounds,
  };

  const [ref, selected, onClick, linked] = useUnitSelectionTarget(d);
  const selection = useSelectionStyle(selectionStyle, selected, linked);

  // Without its color, a unit keeps its outline in that color
  const color = getMixedUnitColor(d, lithMap, null, false);
  let backgroundColor = color;
  if (selection.uncolored) backgroundColor = "transparent";

  return h(
    "g.unit",
    {
      className: classNames(className, selection.className),
      style: {
        "--column-unit-background-color": backgroundColor,
        "--column-stroke-color": color,
      },
    },
    [
      h("rect.unit.background", {
        ref,
        ...bounds,
        fill: backgroundColor,
        fillOpacity: 0.8,
        stroke: color,
        onClick,
      }),
      h.if(linked)("rect.linked-overlay", bounds),
      h.if(selected)("rect.selection-overlay", {
        ...bounds,
        className: selection.overlayClassName,
      }),
    ],
  );
}

function Unit(props: UnitProps) {
  const {
    division: d,
    children,
    fill,
    defaultFill = "transparent",
    className,
    widthFraction = 1,
    backgroundColor,
    patternColor,
    patternID,
    selectionStyle,
    axisType: _, // not sure why this is brought in...
    ...baseBounds
  } = props;

  const { axisType } = useColumn();

  const hasOverflowTop = d.t_clip_pos != null;
  const hasOverflowBottom = d.b_clip_pos != null;

  const bounds = {
    ...useUnitRect(d, { widthFraction, axisType }),
    ...baseBounds,
    overflowTop: hasOverflowTop,
    overflowBottom: hasOverflowBottom,
  };
  const _patternID = patternID ?? getBestFGDCPatternForUnit(d);
  let _fill = fill ?? useGeologicPattern(_patternID, defaultFill);

  const [ref, selected, onClick, linked] = useUnitSelectionTarget(d);
  const selection = useSelectionStyle(selectionStyle, selected, linked);

  let _backgroundColor = backgroundColor;
  if (selection.uncolored) _backgroundColor = null;
  const hasBackgroundColor = _backgroundColor != null;

  const _className = classNames(className, selection.className, {
    colored: hasBackgroundColor,
  });

  return h(
    "g.unit",
    {
      className: _className,
      style: {
        "--column-unit-background-color": _backgroundColor,
      },
    },
    [
      h(ClippableRect, {
        ...bounds,
        fill: _backgroundColor ?? "transparent",
        onClick,
        className: cls("background"),
      }),
      h(ClippableRect, {
        ref,
        ...bounds,
        fill: _fill,
        //mask,
        onClick,
        className: cls("unit"),
      }),
      h.if(linked)(ClippableRect, {
        ...bounds,
        className: cls("linked-overlay"),
      }),
      h.if(selected)(ClippableRect, {
        ...bounds,
        className: classNames(
          cls("selection-overlay"),
          selection.overlayClassName,
        ),
      }),
      //defs,
      children,
    ],
  );
}

function LabeledUnit(props: LabeledUnitProps) {
  const {
    division,
    label,
    onLabelUpdated,
    widthFraction,
    showLabel = true,
    backgroundColor,
    patternID,
    selectionStyle,
    axisType: _, // not sure why this is brought in...
    ...baseBounds
  } = props;

  const { axisType, isTransitioning, hideLabelsWhileTransitioning } =
    useColumn();
  const bounds = {
    ...useUnitRect(division, { widthFraction, axisType }),
    ...baseBounds,
  };
  const { width, height } = bounds;
  // Labels stay visible through the animation by default. `hideLabelsWhileTransitioning`
  // is a perf escape hatch: when set, the `foreignObject` label (whose HTML
  // reflows on every size change) is skipped mid-transition and restored on settle.
  const skipLabel = isTransitioning && hideLabelsWhileTransitioning;
  return h(
    Unit,
    {
      className: "labeled-unit",
      division,
      backgroundColor,
      patternID,
      selectionStyle,
      ...bounds,
    },
    [
      h.if(showLabel && !skipLabel)(
        ForeignObject,
        { ...bounds, className: "unit-label-container" },
        h(SizeAwareLabel, {
          className: "unit-overlay",
          labelClassName: "unit-label",
          style: { width, height },
          label,
          // Re-fit the label when a transition settles (isTransitioning flips),
          // not on every intermediate frame.
          remeasureKey: isTransitioning,
          onVisibilityChanged(viz) {
            onLabelUpdated(label, viz);
          },
        }),
      ),
    ],
  );
}

function UnitBoxes<T>(props: {
  unitComponent: React.FunctionComponent<{ division: T }>;
  unitComponentProps?: any;
  transformDivisions?(divisions: T[]): T[];
  transformDivision?: (
    division: any,
    index: number,
    divisions: any[],
  ) => T | null;
}) {
  const { unitComponent = Unit, unitComponentProps = {} } = props;
  const { divisions } = useContext(ColumnContext);

  if (divisions.length == 0) {
    console.warn("No divisions found in column context");
    return null;
  }

  const children = useMemo(() => {
    return divisions.map((division: any, i) => {
      // @ts-ignore
      return h(unitComponent, {
        division,
        key: division.unit_id,
        ...unitComponentProps,
      });
    });
  }, [divisions, unitComponent, unitComponentProps]);

  return h(
    PatternDefsProvider,
    { resolveID: getBestFGDCPatternForUnit, scalePattern },
    h("g.divisions", children),
  );
}

export { LabeledUnit, Unit, UnitBoxes, UnitProps };

/** Classes that draw a unit's selection in the chosen style. The styles live
 * with the column's (`column.module.sass`). */
function useSelectionStyle(
  style:
    UnitSelectionStyle | `${UnitSelectionStyle}` = UnitSelectionStyle.Overlay,
  selected: boolean,
  linked: boolean,
) {
  const hasSelection = useHasUnitSelection();
  // Linked units (sharing the selection's name) stand out with the selection
  const backgrounded = hasSelection && !selected && !linked;
  const dimmed = backgrounded && style == UnitSelectionStyle.DimOthers;
  const uncolored = backgrounded && style == UnitSelectionStyle.ColorSelected;
  return {
    uncolored,
    className: classNames({ dimmed, uncolored }),
    overlayClassName: classNames({
      "outline-only": style != UnitSelectionStyle.Overlay,
    }),
  };
}
