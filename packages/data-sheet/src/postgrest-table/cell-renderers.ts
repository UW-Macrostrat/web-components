import { useInDarkMode } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";
import { Tag } from "@blueprintjs/core";
import { asChromaColor } from "@macrostrat/color-utils";
import classNames from "classnames";

export function LithologyTag({ data, className = null }) {
  const darkMode = useInDarkMode();
  const luminance = darkMode ? 0.9 : 0.4;
  const color = asChromaColor(data.color);
  return h(
    Tag,
    {
      key: data.id,
      className: classNames("lithology-tag", className),
      minimal: true,
      style: {
        color: color?.luminance(luminance).hex(),
        backgroundColor: color?.luminance(1 - luminance).hex(),
      },
    },
    h("span.contents", [h("span.name", data.name)])
  );
}
