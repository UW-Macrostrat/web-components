import hyper from "@macrostrat/hyper";
import { Button, Popover } from "@blueprintjs/core";
import { DOMElement } from "react";
import { JSONView } from "@macrostrat/ui-components";
import styles from "./selection-popover.module.sass";
import { useSelectedUnit } from "./units";

const h = hyper.styled(styles);

export function UnitDetailsPopover({
  style,
  children,
  boundary,
}: {
  style: object;
  children: React.ReactNode;
  boundary?: DOMElement<any, any>;
}) {
  const content = h(LegendPopoverContainer, children);

  return h(
    "div.popover-main",
    {
      style,
    },
    h(
      Popover,
      { content, isOpen: true, usePortal: false, boundary },
      h("span.popover-target")
    )
  );
}

export function LegendPopoverContainer({ children }) {
  return h("div.legend-panel-outer", [h("div.legend-info-panel", children)]);
}

export function LegendPanelHeader({ title, id, onClose }) {
  return h("header.legend-panel-header", [
    h.if(title != null)("h3", title),
    h("div.spacer"),
    h.if(id != null)("code", id),
    h.if(onClose != null)(Button, {
      icon: "cross",
      minimal: true,
      small: true,
      onClick() {
        onClose();
      },
    }),
  ]);
}

export function UnitSelectionPopover(props) {
  const unit = useSelectedUnit();
  if (unit == null) {
    return null;
  }

  return h(
    "div.unit-popover-container",
    h(UnitDetailsPopover, h(JSONView, { data: unit, showRoot: false }))
  );
}
