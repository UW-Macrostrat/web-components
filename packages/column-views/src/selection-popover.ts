import hyper from "@macrostrat/hyper";
import { Button, Popover } from "@blueprintjs/core";
import { DOMElement } from "react";
import styles from "./selection-popover.module.sass";
import { useSelectedUnit, useUnitSelectionStore } from "./units";
import { UnitDetailsPanel } from "./unit-details";

const h = hyper.styled(styles);

export function UnitDetailsPopover({
  style,
  children,
  viewportPadding = 20,
}: {
  style: object;
  viewportPadding?: number;
  children: React.ReactNode;
}) {
  const content = h(LegendPopoverContainer, children);

  return h(
    "div.popover-main",
    {
      style,
    },
    h(
      Popover,
      // @ts-ignore
      {
        content,
        isOpen: true,
        usePortal: false,
        position: "right",
        modifiers: {
          preventOverflow: { options: { padding: viewportPadding } },
        },
      },
      h("span.popover-target")
    )
  );
}

export function LegendPopoverContainer({ children }) {
  return h(
    "div.legend-panel-outer",
    {
      onClick(e) {
        // Stop events from leaking to the parent
        e.stopPropagation();
      },
    },
    [h("div.legend-info-panel", children)]
  );
}

export function UnitSelectionPopover() {
  const unit = useSelectedUnit();
  const position = useUnitSelectionStore((state) => state.overlayPosition);
  if (unit == null) {
    return null;
  }

  return h(
    "div.unit-popover-container",
    h(
      UnitDetailsPopover,
      {
        style: {
          position: "absolute",
          top: position?.y,
          width: position?.width,
          left: position?.x,
          height: position?.height,
        },
      },
      h(UnitDetailsPanel, { unit, showLithologyProportions: true })
    )
  );
}
