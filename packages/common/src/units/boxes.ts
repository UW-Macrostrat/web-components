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
  Clickable
} from "@macrostrat/column-components";
import { IUnit } from "./types";
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

enum ColumnAxisType {
  AGE = "age",
  HEIGHT = "pos"
}

function useUnitRect(
  division: IUnit,
  options: UnitRectOptions = {}
): RectBounds {
  const { widthFraction = 1, axisType = "age" } = options;
  const { scale } = useContext(ColumnContext);
  const { width } = useContext(ColumnLayoutContext);
  const y = scale(division["t_" + axisType]);
  const height = Math.abs(scale(division["b_" + axisType]) - y);
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
    axisType,
    ...baseBounds
  } = props;
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
  const { division, label, onLabelUpdated, widthFraction, axisType } = props;
  const bounds = { ...useUnitRect(division, { widthFraction, axisType }) };
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

export { Unit, UnitBoxes, UnitProps, LabeledUnit, ColumnAxisType };
