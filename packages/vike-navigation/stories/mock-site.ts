import hyper from "@macrostrat/hyper";
import { ReactNode } from "react";
import { resolveRoute } from "vike/routing";
import { VikeReactProviderPageContext } from "vike-react/usePageContext";
import { Tag } from "@blueprintjs/core";
import {
  NavigationPageContext,
  PageInfoConfig,
  RouteCrumb,
  SiteNavigationConfig,
  SiteNavigationProvider,
  SiteLogoLink,
} from "../src";
import rockdIcon from "./rockd-icon.png";
import styles from "./navigation.stories.module.sass";

const h = hyper.styled(styles);

/** A site's routes, keyed by Vike route string, each with its `pageInfo`. */
export type MockRoutes = Record<string, PageInfoConfig>;

export interface MockPageOptions {
  url: string;
  routes: MockRoutes;
  is404?: boolean;
  abortReason?: string;
  /** Leave `breadcrumbs` unset, as when the trail wasn't built on a server. */
  withoutServerTrail?: boolean;
  config?: Record<string, any>;
  [key: string]: any;
}

/**
 * A stand-in Vike page context: `breadcrumbs` matched against `routes` the way
 * `getBreadcrumbs` matches the real route table, and each route as a page
 * whose config holds its `pageInfo`.
 */
export function mockPageContext(opts: MockPageOptions): NavigationPageContext {
  const { url, routes, withoutServerTrail, config = {}, ...rest } = opts;
  const pages = Object.fromEntries(
    Object.entries(routes).map(([route, pageInfo]) => [
      route,
      { config: { pageInfo } },
    ]),
  );
  const current = matchRoute(routes, url);
  let breadcrumbs: RouteCrumb[] | undefined = undefined;
  if (!withoutServerTrail) {
    breadcrumbs = ancestorPaths(url)
      .map((path) => ({ path, match: matchRoute(routes, path) }))
      .filter(({ match }) => match != null)
      .map(({ path, match }) => ({
        url: path,
        slug: path.slice(path.lastIndexOf("/") + 1),
        pageId: match.pageId,
        routeParams: match.routeParams,
      }));
  }
  return {
    urlPathname: url,
    routeParams: current?.routeParams ?? {},
    breadcrumbs,
    pages,
    config,
    ...rest,
  };
}

/** Renders `children` as if on `page` of a site. */
export function MockSite({
  page,
  site = macrostrat,
  children,
}: {
  page: MockPageOptions;
  site?: SiteNavigationConfig;
  children: ReactNode;
}) {
  const pageContext = mockPageContext(page);
  return h(
    VikeReactProviderPageContext,
    { pageContext: pageContext as any },
    h(SiteNavigationProvider, site, children),
  );
}

function matchRoute(routes: MockRoutes, path: string) {
  for (const route of Object.keys(routes)) {
    const { match, routeParams } = resolveRoute(route, path);
    if (match) return { pageId: route, routeParams };
  }
  return null;
}

function ancestorPaths(url: string) {
  const segs = url.split("/").filter(Boolean);
  return ["/", ...segs.map((_, i) => "/" + segs.slice(0, i + 1).join("/"))];
}

const macrostratIconURL =
  "https://storage.macrostrat.org/assets/web/macrostrat-icons/macrostrat-icon-simple.svg";

export const macrostrat: SiteNavigationConfig = {
  siteName: "Macrostrat",
  logo: h(SiteLogoLink, { src: macrostratIconURL, label: "Macrostrat home" }),
  rootCrumb: h("span.wordmark", "Macrostrat"),
  renderIdentifier: (id) => h("span.mono-identifier", "#" + id),
};

export const rockd: SiteNavigationConfig = {
  siteName: "Rockd",
  logo: h(SiteLogoLink, { src: rockdIcon, label: "Rockd home" }),
};

/** Macrostrat's routes, abridged, with `pageInfo` as the website declares it. */
export const macrostratRoutes: MockRoutes = {
  "/": { name: "Macrostrat" },
  "/about": { name: "About" },
  "/about/people": { name: "People" },
  "/lex": { name: "Lexicon" },
  "/lex/strat-names": { name: "Stratigraphic names", shortTitle: "Names" },
  "/lex/strat-names/@id": (ctx) => ({
    name: "Mancos Shale",
    title: () =>
      h("span.lex-title", [
        "Mancos Shale",
        h(Tag, { minimal: true, round: true }, "Formation"),
      ]),
    identifier: Number(ctx.routeParams.id),
  }),
  "/maps": { name: "Maps" },
  "/maps/@id": (ctx) => ({
    name: "Grand Canyon",
    title:
      "Geologic map of Grand Canyon National Park, Arizona (1:62,500 scale)",
    identifier: Number(ctx.routeParams.id),
  }),
  "/columns": { name: "Columns" },
  "/columns/@column": (ctx) => ({
    name: "Book Cliffs",
    identifier: Number(ctx.routeParams.column),
  }),
  "/columns/@column/edit": { name: "Edit" },
  "/columns/@column/edit/units": { name: "Units" },
  "/columns/@column/edit/units/@unit": (ctx) => ({
    name: "Castlegate Sandstone",
    identifier: Number(ctx.routeParams.unit),
  }),
  // Docs pages label ancestors by slug, as the vault-backed site pages do.
  "/docs": { name: "Documentation" },
  "/docs/*": {
    name: (slug: string) => docLabels[slug] ?? slug,
  },
};

const docLabels: Record<string, string> = {
  website: "Website",
  map: "Map interface",
  usage: "Using the map",
};

export const rockdRoutes: MockRoutes = {
  "/": { name: "Rockd" },
  "/orgs": { name: "Organizations" },
  "/orgs/@slug": (ctx) => ({
    name: "Wisconsin Geological and Natural History Survey",
    shortTitle: "WGNHS",
  }),
  "/trip/@id": (ctx) => ({
    name: "Trip",
    title: "Baraboo Hills field trip",
    identifier: Number(ctx.routeParams.id),
  }),
  "/trip": { name: "Trips" },
};
