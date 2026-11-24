import { createContext, ReactNode, useContext, useMemo } from "react";
import hyper from "@macrostrat/hyper";
import { usePageContext } from "vike-react/usePageContext";
import { buildBreadcrumbs, nameForItem } from "./breadcrumbs";
import type { BreadcrumbItem } from "./types";

const h = hyper;

/** What distinguishes one site's navigation from another's. */
export interface SiteNavigationConfig {
  /** The root crumb's label, e.g. "Macrostrat" or "Rockd". */
  siteName?: string;
  /** The site's mark, linking home. Shown beside the trail, in place of the
   * root crumb once space runs short. */
  logo?: ReactNode;
  /** How the root crumb renders, e.g. a wordmark. Defaults to `siteName`. */
  rootCrumb?: ReactNode;
  /** How an item's `identifier` renders. Defaults to the bare value. */
  renderIdentifier?: (identifier: number | string) => ReactNode;
}

const SiteNavigationContext = createContext<SiteNavigationConfig>({});

/** Sets the site's name, logo and identifier style for every header and
 * trail below it. Mount once, in the app's `+Layout`. */
export function SiteNavigationProvider({
  children,
  ...config
}: SiteNavigationConfig & { children?: ReactNode }) {
  const parent = useContext(SiteNavigationContext);
  const value = useMemo(
    () => ({ ...parent, ...config }),
    [
      parent,
      config.siteName,
      config.logo,
      config.rootCrumb,
      config.renderIdentifier,
    ],
  );
  return h(SiteNavigationContext.Provider, { value }, children);
}

export function useSiteNavigation(): SiteNavigationConfig {
  return useContext(SiteNavigationContext);
}

/** The current page's trail, root first, its last item the page itself. */
export function usePageBreadcrumbs(): BreadcrumbItem[] {
  const ctx = usePageContext();
  const { siteName } = useSiteNavigation();
  return useMemo(() => {
    if (ctx == null) return [];
    return buildBreadcrumbs(ctx, { siteName });
  }, [ctx, siteName]);
}

/** The current page's own item. */
export function usePageItem(): BreadcrumbItem | null {
  const items = usePageBreadcrumbs();
  return items[items.length - 1] ?? null;
}

/** The current page's full title, e.g. for the document title. */
export function usePageTitle(): ReactNode {
  return nameForItem(usePageItem(), false);
}
