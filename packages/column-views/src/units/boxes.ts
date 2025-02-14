import {
  ColumnAxisType,
  ColumnContext,
  ColumnLayoutContext,
  ForeignObject,
  PatternDefsProvider,
  useColumn,
  useGeologicPattern,
} from "@macrostrat/column-components";
import { SizeAwareLabel, Clickable } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { resolveID, scalePattern } from "./resolvers";
import { useSelectedUnit, useUnitSelectionDispatch } from "./selection";
import { IUnit, transformAxisType } from "./types";
import styles from "./boxes.module.sass";

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
}

interface UnitProps extends Clickable, Partial<RectBounds>, UnitRectOptions {
  division: IUnit;
  resolveID?(IUnit): string;
  UUID?: string;
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
    width: widthFraction * width,
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
    ...baseBounds,
  };
  const patternID = resolveID(d);
  const fill = useGeologicPattern(patternID, defaultFill);
  // Allow us to select this unit if in the proper context

  const ref = useRef<HTMLElement>();

  const [selected, onClick] = useUnitSelectionManager(ref, d);

  return h("g.unit", { className }, [
    h("rect.unit", {
      ref,
      ...bounds,
      fill,
      onClick,
    }),
    h.if(selected)("rect.selection-overlay", bounds),
    children,
  ]);
}

function useUnitSelectionManager(
  ref: React.RefObject<HTMLElement>,
  unit: IUnit
): [boolean, (evt: Event) => void] {
  const selectedUnit = useSelectedUnit();
  const selected = selectedUnit?.unit_id == unit.unit_id;

  const dispatch = useUnitSelectionDispatch();

  const onClick = useCallback(
    (evt: Event) => {
      dispatch(unit, ref.current, evt);
      evt.stopPropagation();
    },
    [unit, ref, dispatch]
  );

  useEffect(() => {
    if (!selected) return;
    // In case we haven't set the position of the unit (if we don't have a target), set the selected unit
    dispatch(unit, ref.current, null);

    // Scroll the unit into view
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [selected]);

  return [selected, onClick];
}

function LabeledUnit(props: LabeledUnitProps) {
  const { division, label, onLabelUpdated, widthFraction, ...baseBounds } =
    props;

  const { axisType } = useColumn();
  const bounds = {
    ...useUnitRect(division, { widthFraction, axisType }),
    ...baseBounds,
  };
  const { width, height } = bounds;
  return h(Unit, { className: "labeled-unit", division, ...bounds }, [
    h(
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

  const children = useMemo(() => {
    return divisions.map((division: any, i) => {
      // @ts-ignore
      return h(unitComponent, {
        division,
        key: division.unit_id,
        axisType: ColumnAxisType.HEIGHT,
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
