import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import {
  asCSSVariables,
  getLuminanceAdjustedColorScheme,
} from "@macrostrat/color-utils";
import styles from "./lithology-tag.module.sass";
import { DataField } from "./index";
import { ReactNode } from "react";

const h = hyper.styled(styles);

export enum LithologyTagSize {
  Small = "small",
  Normal = "normal",
  Large = "large",
}

export function LithologyTag({
  data,
  color,
  className = null,
  expandOnHover = false,
  showProportion = true,
  showAttributes = false,
  size,
}) {
  const darkMode = useInDarkMode();
  const scheme: any = getLuminanceAdjustedColorScheme(
    color ?? data.color,
    darkMode
  );

  let proportion = null;
  if (data.prop != null && showProportion) {
    const prop = Math.round(data.prop * 100);
    proportion = h("span.lithology-proportion", `${prop}%`);
  }

  const coreTag = h(
    "span.lithology-tag-main",
    h("span.contents", [
      h("span.name", data.name),
      h.if(expandOnHover)("code.lithology-id", `${data.lith_id}`),
      proportion,
    ])
  );

  let atts = null;
  if (showAttributes && data.atts != null && data.atts.length > 0) {
    atts = data.atts.map((att) => {
      return h("span.lithology-attribute", att);
    });
    atts = commaSeparated(atts);
    atts = h("span.lithology-attributes", atts);
  }

  let fontSize = null;
  if (size === LithologyTagSize.Small) {
    fontSize = "12px";
  } else if (size === LithologyTagSize.Normal) {
    fontSize = "1em";
  } else if (size === LithologyTagSize.Large) {
    fontSize = "1.4em";
  }

  return h(
    "span.lithology-tag",
    {
      key: data.id,
      className,
      style: asCSSVariables({ ...scheme, fontSize }),
    },
    [atts, coreTag]
  );
}

function commaSeparated(children) {
  return children.reduce((acc, el, i) => {
    if (i > 0) {
      acc.push(h("span.lithology-attribute-sep", ", "));
    }
    acc.push(el);
    return acc;
  }, []);
}

export function LithologyList({
  lithologies,
  lithologyMap,
  showProportions = false,
  showAttributes = false,
}: {
  lithologies: any[];
  lithologyMap?: Map<number, any>;
  showProportions?: boolean;
}) {
  return h(
    DataField,
    { label: "Lithologies" },
    h(
      ItemList,
      { className: "lithology-list" },
      lithologies.map((lith) => {
        let color = lithologyMap?.get(lith.lith_id)?.color;
        return h(LithologyTag, {
          data: lith,
          color,
          showProportion: showProportions,
          showAttributes: showAttributes,
        });
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
