import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { Tag } from "@blueprintjs/core";
import { asChromaColor } from "@macrostrat/color-utils";
import styles from "./lithology-tag.module.sass";
import classNames from "classnames";
import { DataField } from "./index";

const h = hyper.styled(styles);

export function LithologyTag({
  data,
  className = null,
  expandOnHover = false,
}) {
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
    h("span.contents", [
      h("span.name", data.name),
      h.if(expandOnHover)("code.lithology-id", `${data.lith_id}`),
    ])
  );
}

export function LithologyList({ lithologies }) {
  return h(
    DataField,
    { label: "Lithologies" },
    h(
      "span.lithology-list",
      lithologies.map((lith) => {
        return h(LithologyTag, { data: lith });
      })
    )
  );
}

export function EnvironmentsList({ environments }) {
  return h(
    DataField,
    { label: "Environments" },
    h(
      "span.environments-list",
      environments.map((lith) => {
        return h(LithologyTag, { data: lith });
      })
    )
  );
}
