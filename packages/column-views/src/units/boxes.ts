import h from "@macrostrat/hyper";
import { useContext, ReactNode } from "react";
import {
  ColumnContext,
  ColumnLayoutContext,
  PatternDefsProvider,
  useGeologicPattern,
  ForeignObject,
  SizeAwareLabel,
  SizeAwareLabelProps,
  Clickable,
  ColumnAxisType,
  useColumn
} from "@macrostrat/column-components";
import { IUnit, transformAxisType } from "./types";
import { useSelectedUnit, useUnitSelector } from "./selection";
import { resolveID, scalePattern } from "./resolvers";

interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UnitRectOptions {
  widthFraction?: number;
  axisType?: ColumnAxisType;
}

interface UnitProps extends Clickable, Partial<RectBounds>, UnitRectOptions {
  division: IUnit;
  resolveID(IUnit): string;
  UUID: string;
  defaultFill?: string;
  widthFraction?: number;
  children?: ReactNode;
  className?: string;
}

interface LabeledUnitProps
  extends UnitRectOptions,
    Clickable,
    Partial<RectBounds> {
  division: IUnit;
  label: string;
  onLabelUpdated?(label: string, shown: boolean);
  halfWidth?: boolean;
}

function useUnitRect(
  division: IUnit,
  options: UnitRectOptions = {}
): RectBounds {
  const { widthFraction = 1, axisType = ColumnAxisType.AGE } = options;
  const { scale } = useContext(ColumnContext);
  const { width } = useContext(ColumnLayoutContext);
  const macrostratAxisKey = transformAxisType(axisType);
  const t_key = "t_" + macrostratAxisKey;
  const b_key = "b_" + macrostratAxisKey;

  const topHeight = division[t_key];
  const bottomHeight = division[b_key];
  if (topHeight == null && bottomHeight == null) {
    console.warn(
      `Missing keys ${t_key} and ${b_key} for ${division.unit_id} (${division.unit_name})`
    );
  }

  const y = scale(topHeight);
  const height = Math.abs(scale(bottomHeight) - y);

  return {
    x: width * (1 - widthFraction),
    y,
    height,
    width: widthFraction * width
  };
}

function Unit(props: UnitProps) {
  const {
    division: d,
    children,
    defaultFill = "transparent",
    className,
    widthFraction = 1,
    ...baseBounds
  } = props;

  const { axisType } = useColumn();
  const bounds = {
    ...useUnitRect(d, { widthFraction, axisType }),
    ...baseBounds
  };
  const patternID = resolveID(d);
  const fill = useGeologicPattern(patternID, defaultFill);
  // Allow us to select this unit if in the proper context
  const onClick = useUnitSelector(d);
  const selectedUnit = useSelectedUnit();
  const selected = selectedUnit?.unit_id == d.unit_id;

  return h("g.unit", { className }, [
    h("rect.unit", {
      ...bounds,
      fill,
      onMouseOver() {
        console.log(d);
      },
      onClick
    }),
    h.if(selected)("rect.selection-overlay", bounds),
    children
  ]);
}

function LabeledUnit(props: LabeledUnitProps) {
  const {
    division,
    label,
    onLabelUpdated,
    widthFraction,
    ...baseBounds
  } = props;

  const { axisType } = useColumn();
  const bounds = {
    ...useUnitRect(division, { widthFraction, axisType }),
    ...baseBounds
  };
  const onClick = useUnitSelector(division);
  const { width, height } = bounds;
  return h(Unit, { className: "labeled-unit", division, onClick, ...bounds }, [
    h(
      ForeignObject,
      bounds,
      h(SizeAwareLabel, {
        className: "unit-overlay",
        labelClassName: "unit-label",
        style: { width, height },
        onClick,
        label,
        onVisibilityChanged(viz) {
          onLabelUpdated(label, viz);
        }
      })
    )
  ]);
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

  return h(
    PatternDefsProvider,
    { resolveID, scalePattern },
    h(
      "g.divisions",
      divisions.map(div => {
        return h(unitComponent, {
          division: div,
          axisType: ColumnAxisType.HEIGHT,
          ...unitComponentProps
        });
      })
    )
  );
}

export { Unit, UnitBoxes, UnitProps, LabeledUnit };
