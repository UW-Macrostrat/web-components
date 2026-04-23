import { Cell } from "@blueprintjs/table";
import { useInDarkMode } from "@macrostrat/ui-components";
import h from "./main.module.sass";
import { getLuminanceAdjustedColorScheme } from "@macrostrat/color-utils";
import { memoize } from "underscore";
import classNames from "classnames";
import { ColorPicker2 } from "@macrostrat/ui-components";
import { useMemo } from "react";

export const ColorPicker = ColorPicker2;

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
  const _style = useMemo(() => {
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

    return {
      ...style,
      color: mainColor,
      backgroundColor,
    };
  }, [value, intent, adjustLuminance, darkMode, style]);

  return h(
    Cell,
    {
      intent,
      className: _className,
      ...rest,
      style: _style,
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
