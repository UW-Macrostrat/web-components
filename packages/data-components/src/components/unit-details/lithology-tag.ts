import h from "@macrostrat/hyper";
import { TagField } from "./base";
import { BaseTagProps, Tag, TagSize } from "./tag";
import { useMemo } from "react";
import { Lithology } from "@macrostrat/api-types";
import classNames from "classnames";
import { MacrostratInteractionManager } from "../../data-links.ts";

interface LithologyTagProps extends Omit<BaseTagProps, "onClick" | "name"> {
  data: Lithology;
  className?: string;
  expandOnHover?: boolean;
  size?: TagSize;
  features?: Set<LithologyTagFeature>;
  onClick?: (event: any, data: Lithology) => void;
  interactionManager?: MacrostratInteractionManager;
}

export enum LithologyTagFeature {
  Proportion = "proportion",
  Attributes = "attributes",
}

export function LithologyTag({
  data,
  color,
  features,
  interactionManager,
  onClick: _onClick,
  ...rest
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
      items: data.atts.map((att) =>
        h("span.lithology-attribute", { key: att }, att),
      ),
      commaSeparated: true,
    });
  }

  const onClick = useMemo(() => {
    if (_onClick == null) return undefined;
    return (event: MouseEvent) => {
      _onClick(event, data);
    };
  }, [data, _onClick]);

  const interactionProps =
    interactionManager?.interactionPropsForItem(data) ?? {};

  return h(Tag, {
    prefix: atts,
    details: proportion,
    name: data.name,
    className: classNames({ clickable: onClick != null }, "lithology-tag"),
    color: color ?? data.color,
    ...rest,
    ...interactionProps,
    onClick,
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
  onClickItem,
  getItemHref,
  className,
  interactionManager,
}: {
  label?: string;
  lithologies: any[];
  features?: Set<LithologyTagFeature>;
  // Optional function to handle click events on each item
  onClickItem?: (event: MouseEvent, data: Lithology) => void;
  // Optional function to get a link location for each item
  getItemHref?: (data: Lithology) => string | null | undefined;
  className?: string;
  interactionManager?: MacrostratInteractionManager;
}) {
  const sortedLiths = useMemo(() => {
    const l1 = [...lithologies];
    l1.sort(lithologyComparison);
    return l1;
  }, [lithologies]);

  return h(
    TagField,
    { label, className },
    sortedLiths.map((lith) => {
      let l1 = { ...lith };
      if (l1.prop == 0) {
        l1.prop = null;
      }

      return h(LithologyTag, {
        data: l1,
        features,
        onClick: onClickItem,
        href: getItemHref?.(lith),
        interactionManager,
      });
    }),
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

export interface EnvironmentsListProps {
  environments: any[];
  onClickItem?: (event: MouseEvent, data: any) => void;
  getItemHref?: (data: any) => string | null | undefined;
  interactionManager?: MacrostratInteractionManager;
  label?: string;
}

export function EnvironmentsList({
  environments,
  onClickItem,
  getItemHref,
  interactionManager,
  label = "Environments",
}: EnvironmentsListProps) {
  return h(
    TagField,
    { label, className: "environments-list" },
    environments.map((env: any) => {
      return h(LithologyTag, {
        data: env,
        onClick: onClickItem,
        href: getItemHref?.(env),
        interactionManager,
      });
    }),
  );
}
