import { ErrorBoundary } from "@macrostrat/ui-components";
import { PopoverNext } from "@blueprintjs/core";
import h from "./main.module.sass";
import { useCallback, useRef } from "react";
import { useSelector } from "../provider";

export function EditorPopup(props) {
  const { children, targetClassName, valueViewer, placement = "right-start" } =
    props;

  // Open state is owned by the store (not local), so navigation, clicks, and
  // the Escape handler all agree on whether the focused cell's surface is
  // open. We never render a focus-stealing element, so keyboard focus stays on
  // the Blueprint table until an editor takes it — that's what keeps arrow-key
  // navigation working (cf. the Color column and read-only detail panels).
  const isOpen = useSelector((s) => s.cellSurfaceOpen);
  const tableElement = useSelector((s) => s.tableElement);
  const openCellSurface = useSelector((s) => s.openCellSurface);
  const closeCellSurface = useSelector((s) => s.closeCellSurface);

  const ref = useRef(null);
  // Whether the surface was open at mousedown. `onSelection` doesn't change
  // open-state for a click on the already-selected cell, so this reflects the
  // true pre-click state and the click toggles cleanly (no flash).
  const wasOpenRef = useRef(false);

  const close = useCallback(
    (suppress: boolean) => {
      closeCellSurface?.({ suppress });
      // Return focus to the table so arrow keys navigate again.
      tableElement?.focus();
    },
    [closeCellSurface, tableElement],
  );

  return h(
    PopoverNext,
    {
      content: h(
        "div.interaction-barrier",
        {
          onMouseDown(evt) {
            evt.nativeEvent.stopImmediatePropagation();
          },
          onKeyDown(evt) {
            if (evt.key === "Escape") {
              close(true);
              evt.stopPropagation();
              evt.preventDefault();
              return;
            }
            // Climb over the interaction barrier to propagate the key event to the table
          },
        },
        h(ErrorBoundary, null, children),
      ),
      enforceFocus: false,
      autoFocus: false,
      animation: "minimal",
      //arrow: false,
      lazy: true,
      // modifiers: {
      //   offset: { enabled: true, options: { offset: [0, 8] } },
      // },
      placement,
      // Fully controlled via `isOpen`; use click (not hover) so hovering the
      // target can't momentarily preview/dismiss the popover.
      interactionKind: "click",
      isOpen,
      // Portal must be used to avoid issues with the editor being clipped to the bounds of the cell
      //usePortal: true,
    },
    h(
      "span.editor-popup-target",
      {
        className: targetClassName,
        onMouseDown: () => {
          wasOpenRef.current = isOpen;
        },
        // Toggle on click of the already-selected cell: clicking an open cell
        // dismisses it (without entering nav mode); clicking a closed one
        // reopens it. New-cell clicks are opened by `onSelection` instead.
        onClick: () => {
          if (wasOpenRef.current) close(false);
          else openCellSurface?.();
        },
        ref,
      },
      valueViewer,
    ),
  );
}
