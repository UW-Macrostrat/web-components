import hyper from "@macrostrat/hyper";
import { Popover } from "@blueprintjs/core";
import styles from "./popover.module.sass";
import {
  useAtomOverlayPosition,
  useMacrostratUnits,
  useSelectedUnits,
  useUnitSelection,
} from "../data-provider";
import { MultiUnitPanel } from "./multi-unit-panel";
import {
  UnitDetailsFeature,
  UnitDetailsPanel,
  UnitDetailsPanelProps,
} from "./panel";
import { Lithology } from "@macrostrat/api-types";
import { LithologyTagFeature } from "@macrostrat/data-components";
import classNames from "classnames";
import { type ReactNode, useMemo } from "react";

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

export function UnitSelectionPopover(
  props: Omit<UnitDetailsPanelProps, "onSelectUnit" | "unit">,
) {
  const [unit, selectUnit] = useUnitSelection();
  const position = useAtomOverlayPosition();
  const selectedUnits = useSelectedUnitsInColumnOrder();
  if (unit == null) {
    return null;
  }

  // Several units selected: a condensed list, where a click narrows the
  // selection to one unit (and so back to its details)
  let panel: ReactNode = h(UnitDetailsPanel, {
    ...props,
    unit,
    className: classNames("legend-panel", props.className),
    onSelectUnit: (id: number) => {
      selectUnit(id, null);
    },
  });
  if (selectedUnits.length > 1) {
    panel = h(MultiUnitPanel, {
      units: selectedUnits,
      primaryUnitID: unit.unit_id,
      className: classNames("legend-panel", props.className),
      onSelectUnit: (id: number) => selectUnit(id, null),
      onClose: () => selectUnit(null, null),
    });
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
      panel,
    ),
  );
}

/** The selected units, top to bottom as they sit in the column */
function useSelectedUnitsInColumnOrder() {
  const selected = useSelectedUnits();
  const units = useMacrostratUnits();
  return useMemo(() => {
    const order = new Map<number, number>(
      units?.map((u, i) => [u.unit_id, i]) ?? [],
    );
    return [...selected].sort(
      (a, b) => (order.get(a.unit_id) ?? 0) - (order.get(b.unit_id) ?? 0),
    );
  }, [selected, units]);
}
