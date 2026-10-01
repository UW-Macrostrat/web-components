import {
  Boundary,
  Breadcrumb,
  Classes,
  Menu,
  MenuItem,
  OverflowList,
  OverflowListProps,
  PopoverNext,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { ReactNode, useCallback } from "react";
import styles from "./page-header.module.sass";

const h = hyper.styled(styles);

export interface Crumb {
  text: ReactNode;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

interface TrailItem extends Crumb {
  /** The site root: collapses last, and vanishes rather than moving into
   * the overflow menu when a logo beside the trail links to the same place. */
  isRoot?: boolean;
  /** The current page's own crumb, which never collapses (it truncates). */
  isCurrent?: boolean;
}

interface BreadcrumbTrailProps {
  crumbs: Crumb[];
  /** Rendered as the trail's final, current crumb (compact mode). */
  current?: ReactNode;
  /** Whether a logo sits beside the trail, standing in for the root crumb. */
  hasLogo: boolean;
}

/**
 * A breadcrumb trail over Blueprint's `OverflowList`. Crumbs collapse from the
 * start into a "…" menu, except the root, which is handed to the list last so
 * it outlives the crumbs below it (CSS `order` puts it back at the head). The
 * current page's crumb never collapses; once everything else has gone, it is
 * the only item that gives, by truncating.
 *
 * Ported from the Macrostrat website's `BreadcrumbTrail`.
 */
export function BreadcrumbTrail({
  crumbs,
  current,
  hasLogo,
}: BreadcrumbTrailProps) {
  const items = buildItems(crumbs, current);
  const hasCurrent = current != null;

  const renderItem = useCallback((item: TrailItem, index: number) => {
    if (item.isCurrent) {
      return h(
        "li.current-crumb",
        { key: "current" },
        h(
          "span",
          { className: Classes.BREADCRUMB_CURRENT, "aria-current": "page" },
          item.text,
        ),
      );
    }
    return h(
      "li",
      { key: index, className: classNames({ "root-crumb": item.isRoot }) },
      h(Breadcrumb, {
        text: item.text,
        href: item.href,
        onClick: item.onClick,
      }),
    );
  }, []);

  const renderOverflow = useCallback(
    (overflowItems: TrailItem[]) => {
      let menuItems = overflowItems;
      if (hasLogo) {
        menuItems = overflowItems.filter((item) => !item.isRoot);
      }
      // A collapsed root on its own leaves nothing to open, so no button.
      if (menuItems.length === 0) {
        return null;
      }
      const menu = h(
        Menu,
        menuItems.map((item, i) =>
          h(MenuItem, {
            key: i,
            text: item.text,
            href: item.href,
            onClick: item.onClick,
          }),
        ),
      );
      return h(
        "li.overflow-crumb",
        { key: "overflow" },
        h(
          PopoverNext,
          { content: menu, placement: "bottom-start" },
          h("span", {
            "aria-label": "Collapsed breadcrumbs",
            role: "button",
            tabIndex: 0,
            className: Classes.BREADCRUMBS_COLLAPSED,
          }),
        ),
      );
    },
    [hasLogo],
  );

  const listProps: OverflowListProps<TrailItem> = {
    className: classNames(Classes.BREADCRUMBS, "trail", {
      "has-current": hasCurrent,
    }),
    tagName: "ol",
    navigable: true,
    navigationAriaLabel: "Breadcrumb",
    collapseFrom: Boundary.START,
    // Without a current crumb nothing has to survive, so the root may go too.
    minVisibleItems: hasCurrent ? 1 : 0,
    items,
    visibleItemRenderer: renderItem,
    overflowRenderer: renderOverflow,
  };
  return h(OverflowList<TrailItem>, listProps);
}

/** Order the trail for collapsing: ancestors below the root first, then the
 * root, then the current crumb (which `minVisibleItems` protects). */
function buildItems(crumbs: Crumb[], current: ReactNode): TrailItem[] {
  const [root, ...rest] = crumbs;
  const items: TrailItem[] = [...rest];
  if (root != null) {
    items.push({ ...root, isRoot: true });
  }
  if (current != null) {
    items.push({ text: current, isCurrent: true });
  }
  return items;
}
