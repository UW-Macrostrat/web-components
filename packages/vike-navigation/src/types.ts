import type { ReactNode } from "react";

/** A page's breadcrumb identity, declared as its `pageInfo` Vike config: an
 * object, or a function of the page context. */
export interface PageInfo {
  /** The crumb's label, or a function of the URL slug and page context. */
  name?: string | ((slug: string, ctx: any) => string) | null;
  /** The full title, used as the page's heading. */
  title?: ReactNode | (() => ReactNode);
  /** A short form for the trail and single-row header. */
  shortTitle?: ReactNode | (() => ReactNode);
  /** A short identifier for the current item, e.g. a database id. */
  identifier?: number | string;
}

export type PageInfoConfig = PageInfo | ((ctx: any) => PageInfo);

/** One step of a route trail, as `getBreadcrumbs` matches it on the server. */
export interface RouteCrumb {
  /** Absent on the "Not found" or "Error" crumb that replaces the last. */
  url?: string;
  slug: string;
  /** Absent when the trail was derived from the URL alone. */
  pageId?: string;
  routeParams?: Record<string, string>;
}

/** A crumb with its `pageInfo` resolved: what headers and trails render. */
export interface BreadcrumbItem {
  href?: string;
  slug: string;
  name: string;
  title?: PageInfo["title"];
  shortTitle?: PageInfo["shortTitle"];
  identifier?: number | string;
  /** The site root (`/`), which a logo beside the trail already links to. */
  isRoot?: boolean;
}

/** The parts of a Vike page context the trail reads. */
export interface NavigationPageContext {
  urlPathname?: string;
  breadcrumbs?: RouteCrumb[];
  is404?: boolean | null;
  abortReason?: unknown;
  pages?: Record<string, { config?: Record<string, any> }>;
  globalContext?: { pages?: Record<string, { config?: Record<string, any> }> };
  config?: Record<string, any>;
  [key: string]: any;
}
