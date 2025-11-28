import hyper from "@macrostrat/hyper";
import { Popover } from "@blueprintjs/core";
import styles from "./popover.module.sass";
import { useSelectedUnit, useUnitSelectionStore } from "../units";
import { UnitDetailsPanel } from "./panel";

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
  const content = h(InteractionBarrier, children);

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
      h("span.popover-target"),
    ),
  );
}

function InteractionBarrier({ children }) {
  return h(
    "div",
    {
      onClick(e) {
        // Stop events from leaking to the parent
        e.stopPropagation();
      },
    },
    children,
  );
}

export function UnitSelectionPopover() {
  const unit = useSelectedUnit();
  const selectUnit = useUnitSelectionStore((state) => state.onUnitSelected);
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
          top: position?.y ?? 0,
          width: position?.width ?? 100,
          left: position?.x ?? 0,
          height: position?.height ?? 100,
        },
      },
      h(UnitDetailsPanel, {
        unit,
        showLithologyProportions: true,
        className: "legend-panel",
        onSelectUnit: (id: number) => {
          console.log("Selected unit in popover:", id);
          selectUnit(id, null, null);
        },
      }),
    ),
  );
}
