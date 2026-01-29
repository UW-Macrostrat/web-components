import { Cell } from "@blueprintjs/table";
import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import {
  asChromaColor,
  getLuminanceAdjustedColorScheme,
} from "@macrostrat/color-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { memoize } from "underscore";
import { Sketch } from "@uiw/react-color";
import classNames from "classnames";

const h = hyper.styled(styles);

export function ColorCell({
  value,
  children,
  style,
  intent,
  adjustLuminance = true,
  className,
  ...rest
}) {
  const darkMode = useInDarkMode();

  const _className = classNames(className, "color-cell");

  let mainColor = "var(--text-color)";
  let backgroundColor = value;

  if (adjustLuminance) {
    // If adjustLuminance is true, get the color scheme based on the value
    let colors = colorCombo(value, darkMode, 0.05);
    if (colors != null) {
      mainColor = colors.mainColor;
      backgroundColor = colors.backgroundColor;
    }
  }

  if (intent != null) {
    // If an intent is specified, override the main color
    mainColor = undefined;
  }

  return h(
    Cell,
    {
      intent,
      className: _className,
      ...rest,
      style: {
        color: mainColor,
        backgroundColor,
        ...style,
      },
    },
    children,
  );
}

export function colorSwatchRenderer(value) {
  return h("span.color-swatch-container", [
    h("span.color-swatch", {
      style: { backgroundColor: value },
    }),
    h("span.color-name", value),
  ]);
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
