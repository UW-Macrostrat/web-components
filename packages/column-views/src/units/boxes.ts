import {
  ColumnAxisType,
  ColumnContext,
  ColumnLayoutContext,
  ForeignObject,
  PatternDefsProvider,
  useColumn,
  useGeologicPattern,
} from "@macrostrat/column-components";
import {
  SizeAwareLabel,
  Clickable,
  useInDarkMode,
} from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { ReactNode, useContext, useMemo } from "react";
import { resolveID, scalePattern } from "./resolvers";
import { useUnitSelectionTarget } from "./selection";
import { IUnit } from "./types";
import styles from "./boxes.module.sass";
import classNames from "classnames";
import { getUnitHeightRange } from "../prepare-units/utils";
import { useLithologies } from "../data-provider";
import { getMixedUnitColor } from "./colors";
import { path } from "d3-path";

const h = hyper.styled(styles);

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UnitRectOptions {
  widthFraction?: number;
  axisType?: ColumnAxisType;
  // Padding to create overflow for zig-zags or other ornamented edges
  padding?: number;
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
}

export interface LabeledUnitProps
  extends UnitRectOptions,
    Clickable,
    Partial<RectBounds> {
  division: IUnit;
  label: string;
  onLabelUpdated?(label: string, shown: boolean);
  halfWidth?: boolean;
  showLabel?: boolean;
  backgroundColor?: string;
}

function useUnitRect(
  division: IUnit,
  options: UnitRectOptions = {}
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
    ...baseBounds
  } = props;

  const { axisType } = useColumn();
  const lithMap = useLithologies();
  const bounds = {
    ...useUnitRect(d, { widthFraction, axisType }),
    ...baseBounds,
  };

  const backgroundColor = getMixedUnitColor(d, lithMap, null, false);

  const [ref, selected, onClick] = useUnitSelectionTarget(d);

  return h(
    "g.unit",
    {
      className,
      style: {
        "--column-unit-background-color": backgroundColor,
        "--column-stroke-color": backgroundColor,
      },
    },
    [
      h("rect.unit.background", {
        ref,
        ...bounds,
        fill: backgroundColor,
        fillOpacity: 0.8,
        stroke: backgroundColor,
        onClick,
      }),
      h.if(selected)("rect.selection-overlay", bounds),
    ]
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
  const patternID = resolveID(d);
  let _fill = fill ?? useGeologicPattern(patternID, defaultFill);

  const hasBackgroundColor = backgroundColor != null;

  const _className = classNames(className, { colored: hasBackgroundColor });

  const [ref, selected, onClick] = useUnitSelectionTarget(d);

  //const key = `unit-${d.unit_id}`;

  return h(
    "g.unit",
    {
      className: _className,
      style: {
        "--column-unit-background-color": backgroundColor,
      },
    },
    [
      h(UnitRect, {
        ...bounds,
        fill: backgroundColor,
        onClick,
        className: "background",
      }),
      h(UnitRect, {
        ref,
        ...bounds,
        fill: _fill,
        //mask,
        onClick,
        className: "unit",
      }),
      h.if(selected)(UnitRect, { ...bounds, className: "selection-overlay" }),
      //defs,
      children,
    ]
  );
}

interface UnitRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  className: string;
  // Used to determine if the rect should have a zig-zag edge on the top or bottom
  overflowTop?: boolean;
  overflowBottom?: boolean;
  [key: string]: any;
}

function UnitRect(props: UnitRectProps) {
  const {
    x,
    y,
    width,
    height,
    overflowTop = false,
    overflowBottom = false,
    ...rest
  } = props;

  if (!overflowTop && !overflowBottom) {
    return h("rect", {
      x,
      y,
      width,
      height,
      ...rest,
    });
  } else {
    const d = zigZagBoxPath(x, y, width, height, overflowTop, overflowBottom);
    return h("path", {
      d,
      ...rest,
    });
  }
}

function zigZagBoxPath(x, y, width, height, top: boolean, bottom: boolean) {
  const zigZagWidth = 8;
  const zigZagHeight = 3;

  const d = path();

  const nZigZags = Math.floor(width / zigZagWidth);
  const zigZagWidthOverall = nZigZags * zigZagWidth;
  const zigZagWidthOffset = (width - zigZagWidthOverall) / 2;

  d.moveTo(x, y);
  const dy = zigZagHeight;
  // Each zig-zag consists of a short outward motion
  const dx = zigZagWidth / 2;

  if (true) {
    // Move to the offset
    let cx = x + zigZagWidthOffset;
    d.lineTo(cx, y);
    // Draw the zig-zags
    for (let i = 0; i < nZigZags; i++) {
      cx += dx;
      d.lineTo(cx, y - dy);
      cx += dx;
      d.lineTo(cx, y);
    }
    // Draw the last line to the right edge
    //d.lineTo(x + zigZagWidthOverall, y);
  }
  // Draw the right edge
  d.lineTo(x + width, y);
  const yBottom = y + height;
  d.lineTo(x + width, y + height);

  if (bottom) {
    const y = yBottom;
    // Draw the bottom zig-zags
    let cx = x + width - zigZagWidthOffset;
    d.lineTo(cx, y);
    for (let i = 0; i < nZigZags; i++) {
      cx -= dx;
      d.lineTo(cx, y + zigZagHeight);
      cx -= dx;
      d.lineTo(cx, y);
    }
  }
  // Draw the last line to the left edge
  d.lineTo(x, y + height);
  // Draw the left edge
  d.closePath();

  // Now render the path;
  return d.toString();
}

function LabeledUnit(props: LabeledUnitProps) {
  const {
    division,
    label,
    onLabelUpdated,
    widthFraction,
    showLabel = true,
    backgroundColor,
    axisType: _, // not sure why this is brought in...
    ...baseBounds
  } = props;

  const { axisType } = useColumn();
  const bounds = {
    ...useUnitRect(division, { widthFraction, axisType }),
    ...baseBounds,
  };
  const { width, height } = bounds;
  return h(
    Unit,
    { className: "labeled-unit", division, backgroundColor, ...bounds },
    [
      h.if(showLabel)(
        ForeignObject,
        { ...bounds, className: "unit-label-container" },
        h(SizeAwareLabel, {
          className: "unit-overlay",
          labelClassName: "unit-label",
          style: { width, height },
          label,
          onVisibilityChanged(viz) {
            onLabelUpdated(label, viz);
          },
        })
      ),
    ]
  );
}

function UnitBoxes<T>(props: {
  unitComponent: React.FunctionComponent<{ division: T }>;
  unitComponentProps?: any;
  transformDivisions?(divisions: T[]): T[];
  transformDivision?: (
    division: any,
    index: number,
    divisions: any[]
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
    { resolveID, scalePattern },
    h("g.divisions", children)
  );
}

export { LabeledUnit, Unit, UnitBoxes, UnitProps };
