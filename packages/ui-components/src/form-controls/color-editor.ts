import h from "@macrostrat/hyper";
import { ErrorBoundary } from "../error-boundary";
import { Sketch } from "@uiw/react-color";
import { Button, Popover } from "@blueprintjs/core";
import { useState } from "react";
import chroma from "chroma-js";

export function BasePopup(props) {
  const { children, isOpen, content, ...rest } = props;

  return h(
    Popover,
    {
      content: h(
        "div.interaction-barrier",
        {
          style: { pointerEvents: "all" },
          onMouseDown(evt) {
            evt.nativeEvent.stopImmediatePropagation();
          },
          onKeyDown(evt) {
            console.log(evt);
          },
        },
        h(ErrorBoundary, null, content),
      ),
      enforceFocus: false,
      autoFocus: false,
      minimal: true,
      modifiers: {
        offset: { enabled: true, options: { offset: [4, 4] } },
      },
      interactionKind: "hover-target",
      isOpen,
      usePortal: false,
      ...rest,
    },
    children,
  );
}

export function ColorEditor(props) {
  const { color = "#aaaaaa", onChange, ...rest } = props;
  const [isOpen, setOpen] = useState(true);

  return h(
    BasePopup,
    {
      ...rest,
      isOpen,
      content: h(Sketch, {
        disableAlpha: true,
        color,
        onChange(color) {
          onChange(chroma(color.hex).name());
        },
      }),
    },
    [
      h(Button, {
        style: {
          backgroundColor: color,
        },
        minimal: true,
        onClick() {
          console.log("Toggling color picker");
          setOpen(!isOpen);
        },
      }),
    ],
  );
}
