import classNames from "classnames";
import { ReactNode } from "react";
import { usePageContext } from "vike-react/usePageContext";
import {
  PageHeader,
  type Crumb,
  type PageHeaderProps,
} from "@macrostrat/ui-components";
import { nameForItem } from "./breadcrumbs";
import {
  SiteNavigationConfig,
  usePageBreadcrumbs,
  useSiteNavigation,
} from "./context";
import type { BreadcrumbItem } from "./types";

import h from "./site-page-header.module.sass";

export type SitePageHeaderProps = Omit<
  PageHeaderProps,
  "breadcrumbs" | "shortTitle"
> & {
  /** Shown right after the title: a status tag that belongs to the page's
   * identity rather than to its controls. */
  titleAdornment?: ReactNode;
  /** The trail to show, root first and ending with the current page. Defaults
   * to the route's; pass one to render outside Vike. */
  items?: BreadcrumbItem[];
};

/**
 * `PageHeader` (`@macrostrat/ui-components`) filled from the route: the site's
 * logo, the trail `getBreadcrumbs` matched, and the current page's title,
 * short title and identifier from its `pageInfo`. Layout options (`variant`,
 * `sticky`, `width`, `actions`, …) pass through, and `title` or `logo`
 * override the route's and the site's. A page's (or subtree's)
 * `headerActions` config leads the action slot, ahead of any `actions`.
 *
 * When sticky (always, for `hybrid`), the header's parent is its sticky
 * boundary, so render it as a direct child of the page or scroll container.
 */
export function SitePageHeader(props: SitePageHeaderProps) {
  const { className, actions, titleAdornment, items, logo, title, ...rest } =
    props;
  const site = useSiteNavigation();
  const routeItems = usePageBreadcrumbs();
  const pageConfig: Record<string, any> | undefined = usePageContext()?.config;
  const PageActions = pageConfig?.headerActions;

  let headerActions: ReactNode = actions;
  if (PageActions != null) {
    headerActions = h([h(PageActions, { key: "page" }), actions]);
  }

  const content = pageHeaderContent(items ?? routeItems, site);
  let headerTitle = title ?? content.title;
  if (titleAdornment != null) {
    headerTitle = h("span.title-with-adornment", [headerTitle, titleAdornment]);
  }

  let headerLogo = logo;
  if (headerLogo === undefined) {
    headerLogo = site.logo;
  }

  return h(PageHeader, {
    ...content,
    title: headerTitle,
    logo: headerLogo,
    titleAlignment: "left",
    actions: headerActions,
    className: classNames("site-page-header", className),
    ...rest,
  });
}

/** `PageHeader`'s trail, title, short title and identifier for a trail of
 * items, root first and ending with the current page. */
export function pageHeaderContent(
  items: BreadcrumbItem[],
  site: SiteNavigationConfig = {},
) {
  const ancestors = items.slice(0, -1);
  const current = items[items.length - 1];

  const breadcrumbs: Crumb[] = ancestors.map((item) => ({
    text: crumbText(item, site),
    href: item.href,
  }));

  let title: ReactNode = null;
  let shortTitle: string | undefined = undefined;
  let identifier: ReactNode = null;
  if (current != null) {
    title = nameForItem(current, false);
    shortTitle = shortTitleFor(current, title);
    if (current.identifier != null) {
      identifier = renderIdentifier(current.identifier, site);
    }
  }
  return { breadcrumbs, title, shortTitle, identifier };
}

function crumbText(item: BreadcrumbItem, site: SiteNavigationConfig) {
  if (item.isRoot && site.rootCrumb != null) {
    return site.rootCrumb;
  }
  return nameForItem(item, true);
}

function renderIdentifier(id: number | string, site: SiteNavigationConfig) {
  if (site.renderIdentifier != null) {
    return site.renderIdentifier(id);
  }
  return String(id);
}

/** A short form for the single-row title, when the page has a distinct one:
 * its `shortTitle`, or its `name` where the full title differs. */
function shortTitleFor(
  item: BreadcrumbItem,
  title: ReactNode,
): string | undefined {
  const short = nameForItem(item, true);
  if (typeof short == "string" && typeof title == "string" && short != title) {
    return short;
  }
  if (
    typeof item.name == "string" &&
    typeof title == "string" &&
    item.name.length < title.length
  ) {
    return item.name;
  }
  return undefined;
}
