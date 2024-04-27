import { Cell } from "@blueprintjs/table";
import { useInDarkMode } from "@macrostrat/ui-components";
import chroma from "chroma-js";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";

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

export function asChromaColor(color): chroma.Color | null {
  // Check if is a chroma color already
  if (color instanceof chroma.Color) {
    return color;
  }
  try {
    return chroma(color);
  } catch (e) {
    return null;
  }
}
