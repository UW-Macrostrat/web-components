import { resolveRoute } from "vike/routing";
import type { RouteCrumb } from "./types";

/**
 * The page matched at each ancestor of the current URL, root first. Call from
 * `+onCreatePageContext.server.ts` and store it as `pageContext.breadcrumbs`
 * (passed to the client), so the trail knows which page, and so which
 * `pageInfo`, each crumb belongs to.
 *
 * Ancestors with no page of their own are skipped. Vike's route precedence is
 * reproduced here because Vike only routes the current URL.
 */
export async function getBreadcrumbs(pageContext: any): Promise<RouteCrumb[]> {
  const { urlPathname } = pageContext;
  const segs = urlPathname.split("/").filter(Boolean);
  const paths = [
    "/",
    ...segs.map((_, i) => "/" + segs.slice(0, i + 1).join("/")),
  ];

  const crumbs: RouteCrumb[] = [];
  for (const path of paths) {
    const hit = await matchBestPage(pageContext, path);
    if (hit == null) continue;
    crumbs.push({
      url: path,
      pageId: hit.pageId,
      routeParams: hit.routeParams,
      slug: lastPathComponent(path),
    });
  }
  return crumbs;
}

type Match = {
  pageId: string;
  routeType: "STRING" | "FILESYSTEM" | "FUNCTION";
  routeString?: string;
  routeParams: Record<string, string>;
  precedence: number | null;
};

async function matchBestPage(pageContext: any, urlPathname: string) {
  const { _pageRoutes } = pageContext.globalContext.dangerouslyUseInternals;

  const matches: Match[] = [];
  for (const r of _pageRoutes) {
    if (r.routeType === "STRING" || r.routeType === "FILESYSTEM") {
      const { match, routeParams } = resolveRoute(r.routeString, urlPathname);
      if (match) {
        matches.push({
          pageId: r.pageId,
          routeType: r.routeType,
          routeString: r.routeString,
          routeParams,
          precedence: null,
        });
      }
      continue;
    }
    // Route functions see a clone of the context with the ancestor URL.
    const clone = {
      ...pageContext,
      urlOriginal: urlPathname,
      urlPathname,
      urlParsed: { ...pageContext.urlParsed, pathname: urlPathname },
    };
    const raw = await r.routeFunction(clone);
    if (raw === false) continue;
    let result = raw;
    if (raw === true) result = {};
    let precedence = null;
    if (typeof result.precedence === "number") precedence = result.precedence;
    matches.push({
      pageId: r.pageId,
      routeType: "FUNCTION",
      routeParams: result.routeParams ?? {},
      precedence,
    });
  }

  return matches.sort(compare)[0] ?? null;
}

// Vike's own definition: a route is static iff matching it against itself
// yields no params.
function isStatic(route: string) {
  return Object.keys(resolveRoute(route, route).routeParams).length === 0;
}

function analyze(route: string) {
  const parts = route.split("/").filter(Boolean);
  const isParam = (s: string) => s.startsWith("@") || s.startsWith(":");
  const isGlob = (s: string) => s === "*";
  let beginning = 0;
  for (const p of parts) {
    if (isParam(p) || isGlob(p)) break;
    beginning++;
  }
  return {
    beginning,
    staticParts: parts.filter((p) => !isParam(p) && !isGlob(p)).length,
    globs: parts.filter(isGlob).length,
    params: parts.filter(isParam).length,
  };
}

function tier(m: Match): number {
  if (m.routeType === "FUNCTION") {
    if (m.precedence != null && m.precedence > 0) return 6;
    if (m.precedence != null && m.precedence < 0) return 1;
    return 3;
  }
  if (m.routeType === "FILESYSTEM") return 5;
  if (isStatic(m.routeString!)) return 4;
  return 2;
}

function compare(a: Match, b: Match): number {
  if (tier(a) !== tier(b)) return tier(b) - tier(a);
  if ((a.precedence ?? 0) !== (b.precedence ?? 0)) {
    return (b.precedence ?? 0) - (a.precedence ?? 0);
  }
  if (!a.routeString || !b.routeString) return 0;
  const x = analyze(a.routeString);
  const y = analyze(b.routeString);
  return (
    y.beginning - x.beginning ||
    y.staticParts - x.staticParts ||
    x.globs - y.globs ||
    y.params - x.params
  );
}

function lastPathComponent(path: string) {
  return path.slice(path.lastIndexOf("/") + 1);
}
