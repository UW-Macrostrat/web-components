import hyper from "@macrostrat/hyper";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { Popover } from "@blueprintjs/core";
import styles from "./main.module.sass";
import { useRef, useState } from "react";

const h = hyper.styled(styles);

export function EditorPopup(props) {
  const { children, content, targetClassName, autoFocus } = props;

  const [isOpen, setIsOpen] = useState(autoFocus);

  const ref = useRef(null);

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
              setIsOpen(false);
              evt.preventDefault();
            }
            // if (!isOpen) {
            //   evt.preventDefault();
            // }
            // Climb over the interaction barrier to propagate the key event to the table
            ref.current.dispatchEvent(new KeyboardEvent("keydown", evt));
          },
        },
        h(ErrorBoundary, null, content)
      ),
      enforceFocus: false,
      autoFocus: false,
      minimal: true,
      modifiers: {
        offset: { enabled: true, options: { offset: [0, 8] } },
      },
      interactionKind: "hover-target",
      isOpen,
      onClose(evt) {
        //props.onKeyDown?.(evt);
        //setIsOpen(false);
      },
      // Portal must be used to avoid issues with the editor being clipped to the bounds of the cell
      usePortal: true,
    },
    h(
      "span.editor-popup-target",
      {
        tabIndex: 0,
        className: targetClassName,
        onClick: () => setIsOpen(!isOpen),
        ref,
      },

      children
    )
  );
}
