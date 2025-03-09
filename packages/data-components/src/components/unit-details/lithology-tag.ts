import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { Tag } from "@blueprintjs/core";
import { asChromaColor } from "@macrostrat/color-utils";
import styles from "./lithology-tag.module.sass";
import classNames from "classnames";
import { DataField } from "./index";
import { ReactNode } from "react";

const h = hyper.styled(styles);

export function LithologyTag({
  data,
  color,
  className = null,
  expandOnHover = false,
}) {
  const darkMode = useInDarkMode();
  const luminance = darkMode ? 0.9 : 0.4;
  const _color = asChromaColor(color ?? data.color);
  return h(
    Tag,
    {
      key: data.id,
      className: classNames("lithology-tag", className),
      minimal: true,
      style: {
        color: _color?.luminance(luminance).hex(),
        backgroundColor: _color?.luminance(1 - luminance).hex(),
      },
    },
    h("span.contents", [
      h("span.name", data.name),
      h.if(expandOnHover)("code.lithology-id", `${data.lith_id}`),
    ])
  );
}

export function LithologyList({
  lithologies,
  lithologyMap,
}: {
  lithologies: any[];
  lithologyMap?: Map<number, any>;
}) {
  return h(
    DataField,
    { label: "Lithologies" },
    h(
      ItemList,
      { className: "lithology-list" },
      lithologies.map((lith) => {
        let color = lithologyMap?.get(lith.lith_id)?.color;
        return h(LithologyTag, { data: lith, color });
      })
    )
  );
}

export function ItemList({
  children,
  className,
}: {
  children?: ReactNode;
  className: string;
}) {
  return h("span.item-list", { className }, children);
}

export function EnvironmentsList({ environments }) {
  return h(
    DataField,
    { label: "Environments" },
    h(
      ItemList,
      { className: "environments-list" },
      environments.map((lith: any) => {
        return h(LithologyTag, { data: lith });
      })
    )
  );
}
