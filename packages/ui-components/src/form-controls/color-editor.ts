import hyper from "@macrostrat/hyper";
import { ErrorBoundary } from "../error-boundary";
import { Sketch } from "@uiw/react-color";
import { Button, Popover } from "@blueprintjs/core";
import chroma from "chroma-js";
import { asChromaColor } from "@macrostrat/color-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

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

export enum ColorConversionType {
  HEX = "hex",
  RGB = "rgb",
  HSL = "hsl",
  CSS = "css",
}

export function ColorPicker2({
  value,
  onChange,
  editable = true,
  type = ColorConversionType.CSS,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current == null) return;
    ref.current.focus();
  }, []);

  const color = useMemo(() => {
    try {
      return asChromaColor(value).hex();
    } catch {
      return "#aaaaaa";
    }
  }, [value]);

  return h(
    "div.color-picker-container",
    {
      onKeyDown(evt) {
        if (evt.key === "Escape") {
          evt.preventDefault();
        }
      },
      ref,
      tabIndex: 0,
    },
    h(Sketch, {
      color,
      disableAlpha: true,
      onChange(color) {
        onChange(asChromaColor(color.hexa)[type]());
      },
    }),
  );
}
