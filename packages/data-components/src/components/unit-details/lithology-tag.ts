import h from "@macrostrat/hyper";
import { TagField } from "./base";
import { Tag, TagSize } from "./tag";
import { useMemo } from "react";

interface LithologyTagProps {
  data: any;
  color?: string;
  className?: string;
  expandOnHover?: boolean;
  size?: TagSize;
  features?: Set<LithologyTagFeature>;
}

export enum LithologyTagFeature {
  Proportion = "proportion",
  Attributes = "attributes",
}

export function LithologyTag({
  data,
  color,
  features,
  size,
}: LithologyTagProps) {
  let proportion = null;
  const showProportion = features?.has(LithologyTagFeature.Proportion) ?? false;
  const showAttributes = features?.has(LithologyTagFeature.Attributes) ?? false;
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

  return h(Tag, {
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
  label,
  lithologies,
  features = new Set([
    LithologyTagFeature.Proportion,
    LithologyTagFeature.Attributes,
  ]),
}: {
  label?: string;
  lithologies: any[];
  features?: Set<LithologyTagFeature>;
}) {
  const sortedLiths = useMemo(() => {
    const l1 = [...lithologies];
    l1.sort(lithologyComparison);
    return l1;
  }, [lithologies]);

  return h(
    TagField,
    { label },
    sortedLiths.map((lith) => {
      let l1 = { ...lith };
      if (l1.prop == 0) {
        l1.prop = null;
      }

      return h(LithologyTag, {
        data: l1,
        features,
      });
    })
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
    TagField,
    { label: "Environments", className: "environments-list" },
    environments.map((lith: any) => {
      return h(LithologyTag, { data: lith });
    })
  );
}
