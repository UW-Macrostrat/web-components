import { useContext, useEffect, useRef } from "react";
import h from "./hyper";
import { select } from "d3-selection";
import { axisLeft } from "d3-axis";
import { ScaleContinuousNumeric, scaleLinear, ScaleLinear } from "d3-scale";
import { useColumn } from "./context";

interface ColumnAxisProps {
  ticks?: number;
  tickArguments?: any;
  tickValues?: any;
  tickFormat?: any;
  tickSize?: any;
  tickSizeInner?: any;
  tickSizeOuter?: any;
  tickPadding?: any;
  tickSpacing?: number;
  showLabel?: (d: any) => boolean;
  showDomain?: boolean;
  className?: string;
}

interface AgeAxisProps extends ColumnAxisProps {
  scale: ScaleContinuousNumeric<number, number>;
  minTickSpacing?: number;
}

const __d3axisKeys = [
  "ticks",
  "tickArguments",
  "tickValues",
  "tickFormat",
  "tickSize",
  "tickSizeInner",
  "tickSizeOuter",
  "tickPadding",
];

export function ColumnAxis(props: ColumnAxisProps) {
  const { scale } = useColumn();
  return h(AgeAxis, { scale, ...props });
}

export function AgeAxis(props: AgeAxisProps) {
  const {
    showLabel,
    className,
    showDomain = true,
    tickSpacing = 60,
    minTickSpacing = 20,
    scale,
  } = props;

  const range = scale.range();

  const pixelHeight = Math.abs(range[0] - range[range.length - 1]);

  let tickValues: number[] | undefined = undefined;

  let ticks = Math.round(pixelHeight / tickSpacing);
  if (pixelHeight < 3 * tickSpacing) {
    // Push ticks towards extrema (we need more than 2 to be resolved)

    let t0: number[] = [];
    while (t0.length <= 2) {
      ticks += 1;
      t0 = scale.ticks(ticks);
    }

    tickValues = t0;
    if (pixelHeight < 2 * tickSpacing) {
      // Only show first and last ticks
      tickValues = [t0[0], t0[t0.length - 1]];
    }
  }

  if (pixelHeight < minTickSpacing) {
    ticks = 1;
    tickValues = scale.ticks(1);
    // Get the last tick value only
    tickValues = [tickValues[0]];
  }

  const defaultProps = {
    ticks,
    // Suppress domain endpoints
    tickSizeOuter: 0,
    tickValues,
  };

  const ref = useRef(null);

  const deps = __d3axisKeys.map((k) => props[k]);
  // Redraw whenever the scale's *mapping* changes, not just its object identity.
  // (Under stable React keys the axis no longer remounts on zoom, so relying on
  // scale identity left tick positions stale when a new scale reused the same
  // reference or a copy compared equal.)
  const scaleKey = `${scale.domain().join(",")}|${scale.range().join(",")}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Build a fresh axis generator each run. Reusing one across renders retained
    // stale d3 config: `.tickValues([...])` set when a section was short would
    // persist after it stretched (where we want a tick *count* instead), leaving
    // that section's axis with labels outside the domain — i.e. no labels.
    const axis = axisLeft().scale(scale);
    for (let k of __d3axisKeys) {
      const val = props[k] ?? defaultProps[k];
      if (val == null) continue;
      axis[k](val);
    }

    const ax = select(el).call(axis);

    if (!showDomain) {
      ax.select(".domain").remove();
    }

    ax.selectAll(".tick text").each(function (d) {
      if (!(showLabel?.(d) ?? true)) {
        select(this).attr("visibility", "hidden");
      }
    });

    return () => {
      select(el).selectAll("*").remove();
    };
  }, [
    scale,
    scaleKey,
    ref.current,
    showDomain,
    showLabel,
    ticks,
    tickValues?.join(","),
    ...deps,
  ]);

  return h("g.y.axis.column-axis", { className, ref });
}
