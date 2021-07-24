import h from "@macrostrat/hyper";
import { useContext, ReactNode } from "react";
import {
  ColumnContext,
  ColumnLayoutContext,
  PatternDefsProvider,
  useGeologicPattern,
  ForeignObject,
  SizeAwareLabel,
  SizeAwareLabelProps
} from "@macrostrat/column-components";
import { IUnit } from "./types";
import { resolveID, scalePattern } from "./resolvers";
import { writeJSON } from "apps/multiscale-figure/scripts/utils";

interface UnitProps {
  division: IUnit;
  resolveID(IUnit): string;
  UUID: string;
  defaultFill?: string;
  widthFractionl?: number;
  children?: ReactNode;
}

function useUnitRect(division: IUnit, widthFraction: number = 1) {
  const { scale } = useContext(ColumnContext);
  const { width } = useContext(ColumnLayoutContext);
  const y = scale(division.t_age);
  const height = Math.abs(scale(division.b_age) - y);
  return {
    x: width * (1 - widthFraction),
    y,
    height,
    width: widthFraction * width
  };
}

const Unit = (props: UnitProps) => {
  const {
    division: d,
    children,
    defaultFill = "transparent",
    widthFraction = 1
  } = props;
  const bounds = useUnitRect(d);
  const patternID = resolveID(d);
  const fill = useGeologicPattern(patternID, defaultFill);

  return h("rect.unit", {
    ...bounds,
    fill,
    onMouseOver() {
      console.log(d);
    },
    children
  });
};

interface LabeledUnitProps extends SizeAwareLabelProps {
  division: IUnit;
  label: string;
  onLabelUpdated?(label: string, shown: boolean);
  halfWidth?: boolean;
}

function LabeledUnit(props: LabeledUnitProps) {
  const { division, label, onLabelUpdated, ...rest } = props;
  const bounds = useUnitRect(division);
  const { x, y, ...size } = bounds;
  return h("g.labeled-unit", [
    h(Unit, { division }),
    h(
      ForeignObject,
      bounds,
      h(SizeAwareLabel, {
        className: "unit-overlay",
        labelClassName: "unit-label",
        style: size,
        label,
        onVisibilityChanged(viz) {
          onLabelUpdated(label, viz);
        },
        ...rest
      })
    )
  ]);
}

function UnitBoxes(props) {
  const { divisions } = useContext(ColumnContext);

  return h(
    PatternDefsProvider,
    { resolveID, scalePattern },
    h(
      "g.divisions",
      divisions.map(div => {
        return h(Unit, {
          division: div
        });
      })
    )
  );
}

export { Unit, UnitBoxes, UnitProps, LabeledUnit };
