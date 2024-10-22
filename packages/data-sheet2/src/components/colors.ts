import { Cell } from "@blueprintjs/table";
import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { asChromaColor } from "@macrostrat/color-utils";
import { HexColorPicker } from "react-colorful";
import { useEffect, useRef } from "react";

const h = hyper.styled(styles);

export function ColorCell({ value, children, style, intent, ...rest }) {
  const darkMode = useInDarkMode();

  return h(
    Cell,
    {
      ...rest,
      style: {
        ...style,
        ...pleasantCombination(value, { darkMode }),
      },
    },
    children
  );
}

export function pleasantCombination(
  color,
  { luminance = null, backgroundAlpha = 0.2, darkMode = false } = {}
) {
  const brighten = luminance ?? darkMode ? 0.5 : 0.1;

  // Check if is a chroma color
  color = asChromaColor(color);
  if (color == null) return {};
  return {
    color: color?.luminance?.(brighten).css(),
    backgroundColor: color?.alpha?.(backgroundAlpha).css(),
  };
}

enum ColorConversionType {
  HEX = "hex",
  RGB = "rgb",
  HSL = "hsl",
  CSS = "css",
}

export function ColorPicker({
  value,
  onChange,
  type = ColorConversionType.CSS,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current == null) return;
    ref.current.focus();
  }, []);

  let color: any;
  try {
    color = asChromaColor(value).hex();
  } catch {
    color = "#aaaaaa";
  }
  return h(
    "div.color-picker-container",
    {
      onKeyDown(evt) {
        console.log(evt);
        if (evt.key === "Escape") {
          evt.preventDefault();
        }
      },
      ref,
      tabIndex: 0,
    },
    h(HexColorPicker, {
      color,
      onChange(color) {
        onChange(asChromaColor(color)[type]());
      },
    })
  );
}
