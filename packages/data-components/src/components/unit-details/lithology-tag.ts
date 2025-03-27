import h from "@macrostrat/hyper";
import { DataField } from "./index";
import { BaseTag, TagSize, ItemList } from "./base-tag";

interface LithologyTagProps {
  data: any;
  color?: string;
  className?: string;
  expandOnHover?: boolean;
  showProportion?: boolean;
  showAttributes?: boolean;
  size?: TagSize;
}

export function LithologyTag({
  data,
  color,
  showProportion = true,
  showAttributes = false,
  size,
}: LithologyTagProps) {
  let proportion = null;
  if (data.prop != null && showProportion) {
    const prop = Math.round(data.prop * 100);
    proportion = h("span.lithology-proportion", `${prop}%`);
  }

  let atts = null;
  if (showAttributes && data.atts != null && data.atts.length > 0) {
    atts = h(List, {
      className: "lithology-attributes",
      items: data.atts.map((att) => h("span.lithology-attribute", att)),
      commaSeparated: true,
    });
  }

  return h(BaseTag, {
    prefix: atts,
    details: proportion,
    name: data.name,
    className: "lithology-tag",
    size,
    color: color ?? data.color,
  });
}

function List({ items, commaSeparated = false, lastSep = null, className }) {
  let items1 = items;
  if (commaSeparated) {
    items1 = separateElementsWithCommas(items1, lastSep);
  }
  return h("span.list", { className }, items1);
}

function separateElementsWithCommas(children: any[], lastSep = null) {
  return children.reduce((acc, el, i) => {
    if (i > 0) {
      let sep = ", ";
      let className = null;
      if (i === children.length - 1 && lastSep != null) {
        sep += lastSep + " ";
        className = "last-sep";
      }
      acc.push(h("span.list-sep", { className }, sep));
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
      lithologies.toSorted(lithologyComparison).map((lith) => {
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

function lithologyComparison(a, b) {
  let dx = (b.prop ?? 0) - (a.prop ?? 0);
  if (dx == 0) {
    dx = (b.atts?.length ?? 0) - (a.atts?.length ?? 0);
  }
  if (dx == 0) {
    return a.name.localeCompare(b.name);
  }
  return dx;
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
