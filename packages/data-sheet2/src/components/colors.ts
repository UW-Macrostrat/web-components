import { Cell } from "@blueprintjs/table";
import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { asChromaColor } from "@macrostrat/color-utils";
import { HexColorPicker } from "react-colorful";

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

export function ColorPicker({ value, onChange }) {
  const darkMode = useInDarkMode();
  let color = "#aaaaaa";
  try {
    color = asChromaColor(value).hex();
  } catch {}
  return h(HexColorPicker, {
    color,
    onChange(color) {
      onChange(asChromaColor(color));
    },
    onKeyDown(evt) {
      console.log(evt);
    },
  });
}
