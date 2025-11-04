import hyper from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import styles from "./index.module.sass";
import { useCallback, useState } from "react";
import classNames from "classnames";

const h = hyper.styled(styles);

/**
 * .scalebar-root {
 *   --scalebar-font-family: "Gotham", sans-serif;
 *   --scalebar-font-size: 12px;
 *   --scalebar-color: #888;
 *   --scalebar-background: #fff;
 * }
 */

export type ScaleBarProps = {
  scale: number; // pixels per meter
  width: number; // width in px
  height?: number;
  margin?: number;
  standalone?: boolean;
  color?: string;
  backgroundColor?: string;
  className?: string;
  labelPosition?: "top" | "bottom";
};

function roundToNearest(d: number, i = 1) {
  return Math.round(d / i) * i;
}

function order(d: number) {
  return Math.floor(Math.log10(d));
}

export function Scalebar({
  scale,
  width,
  height = 10,
  strokeWidth = 2,
  labelPosition = "bottom",
  margin = 10,
  color,
  backgroundColor,
  className,
}: ScaleBarProps) {
  // Calculate geo size and units
  const initGuess = width * scale;
  const o = order(initGuess);
  const rounder = 5 * Math.pow(10, o - 1);
  let geoSize = roundToNearest(initGuess, rounder);
  let label = "m";
  let unitScalar = 1;
  if (geoSize > 1000) {
    unitScalar = 1000;
    label = "km";
  }

  const [lastLabelXVal, setXVal] = useState(0);

  const ref = useCallback((el) => {
    if (el == null) return;
    const bbox = el.getBoundingClientRect();
    setXVal(bbox.x + bbox.width);
  }, []);

  const barWidthActual = geoSize / scale;

  // visx scale and ticks
  const x = scaleLinear<number>({
    domain: [0, geoSize],
    range: [0, barWidthActual],
    nice: true,
  });
  const ndivs = 5;
  const ticks = x.ticks(ndivs);
  const tickPairs = ticks.slice(0, -1).map((t, i) => [t, ticks[i + 1]]);

  // Estimate unit label offset
  const lastTick = ticks[ticks.length - 1];

  const barWidth = x(lastTick) - x(0);

  let styleVars: Record<string, string> = {};
  if (color != null) {
    styleVars["--scalebar-color"] = color;
  }
  if (backgroundColor != null) {
    styleVars["--scalebar-background"] = backgroundColor;
  }

  const paddingTop = 20;
  const paddingBottom = 5;

  const totalHeight = height + paddingTop + paddingBottom;

  const widthText = `${barWidth}px`;

  return h("div.scalebar", [
    h(
      "div.scalebar-container",
      {
        style: { ...styleVars, "--scalebar-width": widthText },
        className: classNames(className, `scalebar-labels-${labelPosition}`),
      },
      [
        h(
          "div.scale-bar",
          {
            style: {
              width: `${barWidth}px`,
            },
          },
          [
            h(
              "div.scale-overlay",
              tickPairs.map(([a, b], i) =>
                h("div.scale-box", {
                  key: i,
                  style: {
                    top: 0,
                    left: `${x(a)}px`,
                    width: `${x(b) - x(a)}px`,
                  },
                  className: i % 2 ? "even" : "",
                }),
              ),
            ),
          ],
        ),
        h(
          "div.tick-labels",
          { ref },
          ticks.map((t, i) =>
            h(
              "div.label",
              {
                key: i,
                style: {
                  left: x(t),
                },
              },
              t / unitScalar,
            ),
          ),
        ),
        h("div.unit-label", label),
      ],
    ),
  ]);
}
