import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { useMemo } from "react";
import { Button, ButtonGroup, Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { useColumnUnits } from "./utils";
import { Column, useAnimatedAgeWindow, type AgeWindow } from "../../src";

/** Named spans to jump between, demonstrating pan-and-contract on a single
 * stratigraphic column. Ordered `t_age` (younger) → `b_age` (older). */
const PRESETS: { label: string; window: AgeWindow }[] = [
  { label: "Cenozoic", window: { t_age: 0, b_age: 66 } },
  { label: "Mesozoic", window: { t_age: 66, b_age: 252 } },
  { label: "Paleozoic", window: { t_age: 252, b_age: 541 } },
];

function AnimatedColumn({ id, ...rest }: any) {
  const units = useColumnUnits(id);

  const fullExtent = useMemo<AgeWindow | null>(() => {
    if (units == null || units.length === 0) return null;
    return {
      t_age: Math.min(...units.map((u: any) => u.t_age)),
      b_age: Math.max(...units.map((u: any) => u.b_age)),
    };
  }, [units]);

  const zoom = useAnimatedAgeWindow({ fullExtent });

  if (units == null || fullExtent == null) {
    return h(Spinner);
  }

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 12 } },
    [
      h("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, [
        h(ButtonGroup, [
          PRESETS.map((p) =>
            h(
              Button,
              {
                key: p.label,
                small: true,
                onClick: () => zoom.zoomToWindow(p.window),
              },
              p.label,
            ),
          ),
        ]),
        h(
          Button,
          {
            small: true,
            intent: "primary",
            disabled: zoom.isFullExtent,
            onClick: () => zoom.reset(),
          },
          "Reset",
        ),
      ]),
      h(Column, {
        units,
        // Animated age window → standard clipping props (pan-and-contract).
        t_age: zoom.window?.t_age,
        b_age: zoom.window?.b_age,
        // Skip per-frame label/pattern work while the window animates.
        isTransitioning: zoom.isAnimating,
        ...rest,
      }),
    ],
  );
}

export default {
  title: "Column views/Column animations/Age window",
  component: AnimatedColumn,
  args: {
    id: 432,
    showLabelColumn: true,
    unconformityLabels: true,
    hideLabelsWhileTransitioning: false,
    minSectionHeight: 200,
  },
  argTypes: {
    hideLabelsWhileTransitioning: { control: { type: "boolean" } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Animated age-window navigation on a single stratigraphic column " +
          "(feature area: *Age scale transition animations*). The period " +
          "buttons animate `t_age`/`b_age` — a pan-and-contract at constant " +
          "density, with zig-zag clipping at the window edges. `isTransitioning` " +
          "suppresses label reflows during the animation.",
      },
      story: { inline: false, iframeHeight: 700 },
    },
  },
} as Meta<typeof AnimatedColumn>;

export const AnimatedAgeWindow = {};

/** Constant density (explicit `pixelScale`), so the column height is strictly
 * proportional to the visible age span. */
export const AnimatedFixedPixelScale = {
  args: {
    pixelScale: 3,
  },
};
