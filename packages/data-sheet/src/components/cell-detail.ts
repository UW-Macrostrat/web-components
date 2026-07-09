import { Dialog } from "@blueprintjs/core";
import h from "./main.module.sass";
import { useSelector } from "../provider";

/**
 * Modal presentation for a cell's `cellDetail` surface. Subscribes to the
 * store's `cellSurfaceOpen` so the dialog opens/closes reactively (Escape,
 * the close button, and outside-click all route through `closeCellSurface`).
 * Rendering the dialog from a plain render snapshot would leave it unable to
 * close, since the cell renderer isn't re-invoked on every store change.
 */
export function CellDetailModal({ title, valueViewer, children }) {
  const isOpen = useSelector((s) => s.cellSurfaceOpen);
  const closeCellSurface = useSelector((s) => s.closeCellSurface);
  const tableElement = useSelector((s) => s.tableElement);

  const onClose = () => {
    closeCellSurface?.();
    tableElement?.focus?.();
  };

  return h([
    valueViewer,
    h(
      Dialog,
      { isOpen, onClose, title, canEscapeKeyClose: true, canOutsideClickClose: true },
      h("div.bp6-dialog-body", children),
    ),
  ]);
}
