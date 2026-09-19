/** A vertical zoom for the age-model stories: how much height the column is
 * given.
 *
 * The timescale zoom narrows *which* ages are shown; this is the other axis of
 * the same question — how far the ages that are shown are stretched down the
 * page. It leaves the layout's own scaling alone and multiplies the heights it
 * works out by a fixed factor (`heightMultiplier`), so sections keep their
 * relative proportions, the density floors keep meaning what they meant, and
 * the unconformity gaps stay the size they are.
 */
import h from "@macrostrat/hyper";
import { useCallback, useState } from "react";
import { Button, ButtonGroup } from "@blueprintjs/core";

const STEPS = [1, 1.5, 2, 3, 4, 6, 8, 12];
const DEFAULT_STEP = 0;

export interface VerticalZoom {
  /** `heightMultiplier` for the `Column` */
  heightMultiplier: number;
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
    heightMultiplier: STEPS[step],
    canStretch: step < STEPS.length - 1,
    canCompress: step > 0,
    stretch,
    compress,
    reset,
  };
}

/** Compress / stretch / reset, with the current factor. */
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
          disabled: zoom.heightMultiplier === STEPS[DEFAULT_STEP],
          onClick: zoom.reset,
        },
        `${zoom.heightMultiplier}×`,
      ),
    ]),
  ]);
}
