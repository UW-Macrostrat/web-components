import hyper from "@macrostrat/hyper";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { Popover } from "@blueprintjs/core";
import styles from "./main.module.sass";
import { useRef, useState } from "react";
import { useSelector } from "../provider";

const h = hyper.styled(styles);

export function EditorPopup(props) {
  const {
    children,
    targetClassName,
    autoFocus,
    valueViewer,
    placement = "right-start",
    minimal = true,
  } = props;

  const [isOpen, setIsOpen] = useState(autoFocus);
  const keyHandler = useSelector((state) => state.keyHandler);

  const ref = useRef(null);

  const inlineEditor = h([
    h("span.editor-value.bp6-table-cell", valueViewer),
    h("input.hidden-editor", {
      value: "",
      autoFocus: true,
      onKeyDown: keyHandler,
    }),
  ]);

  return h(
    Popover,
    {
      content: h(
        "div.interaction-barrier",
        {
          onMouseDown(evt) {
            evt.nativeEvent.stopImmediatePropagation();
          },
          onKeyDown(evt) {
            if (evt.key === "Escape") {
              if (isOpen) {
                setIsOpen(false);
              }
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
      minimal,
      modifiers: {
        offset: { enabled: true, options: { offset: [0, 8] } },
      },
      placement,
      interactionKind: "hover-target",
      isOpen,
      // Portal must be used to avoid issues with the editor being clipped to the bounds of the cell
      usePortal: true,
    },
    h(
      "span.editor-popup-target.bp6-table-cell",
      {
        className: targetClassName,
        onClick: () => setIsOpen(!isOpen),
        ref,
      },
      // If the editor is open, show the inline editor, otherwise show the value viewer
      isOpen ? valueViewer : (inlineEditor ?? valueViewer),
    ),
  );
}
