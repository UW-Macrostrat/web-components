import h from "@macrostrat/hyper";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { SketchPicker } from "react-color";
import { Button } from "@blueprintjs/core";
import { useState } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import chroma from "chroma-js";

export function BasePopup(props) {
  const { children, isOpen, content, ...rest } = props;

  return h(
    Popover2,
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
        h(ErrorBoundary, null, content)
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
    children
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
      content: h(SketchPicker, {
        disableAlpha: true,
        color,
        onChange(color, evt) {
          let c = "";
          try {
            c = chroma(color.hex).name();
          } finally {
            onChange(c);
            evt.stopPropagation();
          }
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
    ]
  );
}
