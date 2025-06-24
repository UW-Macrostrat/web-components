import { Cell } from "@blueprintjs/table";
import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import {
  asChromaColor,
  getLuminanceAdjustedColorScheme,
} from "@macrostrat/color-utils";
import { HexColorPicker } from "react-colorful";
import { useEffect, useRef } from "react";
import { memoize } from "underscore";

const h = hyper.styled(styles);

export function ColorCell({ value, children, style, intent, ...rest }) {
  const darkMode = useInDarkMode();

  const { mainColor, backgroundColor } = colorCombo(value, darkMode) ?? {};

  return h(
    Cell,
    {
      ...rest,
      style: {
        color: mainColor,
        backgroundColor,
        ...style,
      },
    },
    children
  );
}

const colorCombo = memoize(getLuminanceAdjustedColorScheme);

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
