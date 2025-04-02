import { useContext, useEffect, useRef } from "react";
import h from "./hyper";
import { select } from "d3-selection";
import { axisLeft } from "d3-axis";
import { scaleLinear, ScaleLinear } from "d3-scale";
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
  scale?: ScaleLinear<number, number>;
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
    scale,
  } = props;

  const range = scale.range();
  const pixelHeight = Math.abs(range[0] - range[1]);

  let tickValues: number[] = undefined;

  if (pixelHeight < 2 * tickSpacing) {
    // Push ticks towards extrema
    const t0 = scale.ticks(4);

    tickValues = [t0[0], t0[t0.length - 1]];
  }

  const defaultProps = {
    ticks: Math.max(Math.round(pixelHeight / tickSpacing), 2),
    // Suppress domain endpoints
    tickSizeOuter: 0,
    tickValues,
  };

  const ref = useRef(null);
  const axisRef = useRef(axisLeft());

  const deps = __d3axisKeys.map((k) => props[k]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    axisRef.current.scale(scale);
    for (let k of __d3axisKeys) {
      const val = props[k] ?? defaultProps[k];
      console.log("axis", k, val);
      if (val == null) continue;
      axisRef.current[k](val);
    }

    const ax = select(el).call(axisRef.current);

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
  }, [scale, ref.current, showDomain, showLabel, ...deps]);

  return h("g.y.axis.column-axis", { className, ref });
}
