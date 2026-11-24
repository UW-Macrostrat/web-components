import { isValidElement, ReactNode } from "react";
import hyper from "@macrostrat/hyper";
import type {
  BreadcrumbItem,
  NavigationPageContext,
  PageInfo,
  PageInfoConfig,
  RouteCrumb,
} from "./types";

const h = hyper;

export interface BuildBreadcrumbsOptions {
  /** Label for the site root, e.g. "Macrostrat". Defaults to the root
   * page's `pageInfo` name, then "Home". */
  siteName?: string;
}

/**
 * The page context's trail with each crumb's `pageInfo` resolved, root first;
 * the last item is the current page. A pure function of the page context, so
 * it can run anywhere (and be fed a mock one).
 */
export function buildBreadcrumbs(
  ctx: NavigationPageContext,
  options: BuildBreadcrumbsOptions = {},
): BreadcrumbItem[] {
  // Absent when the trail wasn't built on the server, e.g. a client-side
  // abort rendering the error page: the URL still gives a path back.
  const crumbs = [...(ctx.breadcrumbs ?? breadcrumbsFromURL(ctx.urlPathname))];

  const errorText = errorLabel(ctx);
  if (errorText != null) {
    crumbs.pop();
    crumbs.push({ url: undefined, slug: errorText });
  }

  return crumbs.map((crumb, i) => {
    const slug = crumb.slug;
    const pageInfo = resolvePageInfo(ctx, crumb.pageId);

    let text = slug;
    const name = pageInfo?.name;
    if (typeof name === "function") {
      text = name(slug, ctx);
    } else if (name != null) {
      text = name;
    }
    // A bare slug reads as a label once capitalized.
    if (text == slug) {
      text = capitalize(text);
    }

    const isRoot = i === 0 && slug === "";
    if (isRoot) {
      text = options.siteName ?? rootName(pageInfo);
    }

    return {
      href: crumb.url,
      title: pageInfo?.title,
      shortTitle: pageInfo?.shortTitle,
      identifier: pageInfo?.identifier,
      name: text,
      slug,
      isRoot,
    };
  });
}

/** An item's label: its title (or short title), else its name. */
export function nameForItem(
  item: BreadcrumbItem | null | undefined,
  short: boolean = true,
): ReactNode {
  if (item == null) {
    return null;
  }
  let titleVal = item.title;
  if (short) {
    titleVal = item.shortTitle;
  }
  if (typeof titleVal === "string" || isValidElement(titleVal)) {
    return titleVal;
  }
  if (typeof titleVal === "function") {
    return h(titleVal as () => ReactNode);
  }
  return item.name;
}

/** A trail derived from the path alone, with no `pageId` to resolve. */
export function breadcrumbsFromURL(
  urlPathname: string | undefined,
): RouteCrumb[] {
  const segments = (urlPathname ?? "/").split("/").filter(Boolean);
  const crumbs: RouteCrumb[] = [{ url: "/", slug: "" }];
  for (let i = 0; i < segments.length; i++) {
    crumbs.push({
      url: "/" + segments.slice(0, i + 1).join("/"),
      slug: segments[i],
    });
  }
  return crumbs;
}

function resolvePageInfo(
  ctx: NavigationPageContext,
  pageId: string | undefined,
): PageInfo | null {
  if (pageId == null) return null;
  const pages = ctx.pages ?? ctx.globalContext?.pages;
  const config: PageInfoConfig | undefined = pages?.[pageId]?.config?.pageInfo;
  if (typeof config === "function") {
    return config(ctx);
  }
  return config ?? null;
}

function errorLabel(ctx: NavigationPageContext): string | null {
  if (ctx.is404) return "Not found";
  if (ctx.abortReason != null) return "Error";
  return null;
}

function rootName(pageInfo: PageInfo | null): string {
  if (typeof pageInfo?.name === "string") return pageInfo.name;
  return "Home";
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
