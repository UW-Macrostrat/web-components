/** A vertical zoom for the age-model stories: how much height the column is
 * given.
 *
 * The timescale zoom narrows *which* ages are shown; this is the other axis
 * of the same question — how far the ages that are shown are stretched down
 * the page. It works by asking for more room per unit (`targetUnitHeight`),
 * which is the same knob the column sizes itself with: the sections that gain
 * height are the ones with units to show for it, while the floors that keep
 * thin sections legible stay where they are.
 */
import h from "@macrostrat/hyper";
import { useCallback, useState } from "react";
import { Button, ButtonGroup } from "@blueprintjs/core";

/** Pixels for a typical unit, coarsely spaced so the steps read as steps */
const STEPS = [20, 30, 40, 60, 80, 120, 160, 240];
const DEFAULT_STEP = 0;

export interface VerticalZoom {
  /** `targetUnitHeight` for the `Column` */
  targetUnitHeight: number;
  canStretch: boolean;
  canCompress: boolean;
  stretch(): void;
  compress(): void;
  reset(): void;
}

export function useVerticalZoom(): VerticalZoom {
  const [step, setStep] = useState(DEFAULT_STEP);

  const stretch = useCallback(() => {
    setStep((d) => Math.min(d + 1, STEPS.length - 1));
  }, []);
  const compress = useCallback(() => {
    setStep((d) => Math.max(d - 1, 0));
  }, []);
  const reset = useCallback(() => setStep(DEFAULT_STEP), []);

  return {
    targetUnitHeight: STEPS[step],
    canStretch: step < STEPS.length - 1,
    canCompress: step > 0,
    stretch,
    compress,
    reset,
  };
}

/** Compress / stretch / reset, with the height a unit is drawn at. */
export function VerticalZoomControl({
  zoom,
  className,
}: {
  zoom: VerticalZoom;
  className?: string;
}) {
  return h("div.vertical-zoom-control", { className }, [
    h(ButtonGroup, { size: "small" }, [
      h(Button, {
        icon: "zoom-out",
        disabled: !zoom.canCompress,
        onClick: zoom.compress,
        "aria-label": "Compress vertically",
      }),
      h(Button, {
        icon: "zoom-in",
        disabled: !zoom.canStretch,
        onClick: zoom.stretch,
        "aria-label": "Stretch vertically",
      }),
      h(
        Button,
        {
          variant: "minimal",
          disabled: zoom.targetUnitHeight === STEPS[DEFAULT_STEP],
          onClick: zoom.reset,
        },
        `${zoom.targetUnitHeight} px/unit`,
      ),
    ]),
  ]);
}
