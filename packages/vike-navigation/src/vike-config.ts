/**
 * The Vike settings route-aware navigation needs. Spread into the app's root
 * `+config.ts`:
 *
 *     passToClient: [...navigationPassToClient, …],
 *     meta: { ...navigationMeta, … },
 *
 * and fill the trail from `+onCreatePageContext.server.ts`:
 *
 *     pageContext.breadcrumbs = await getBreadcrumbs(pageContext);
 */
export const navigationMeta = {
  // Every ancestor's `pageInfo` is read on the client, so load it eagerly.
  pageInfo: {
    env: { client: true, server: true },
    eager: true,
  },
  headerActions: {
    env: { client: true, server: true },
  },
} as const;

export const navigationPassToClient = ["breadcrumbs"] as const;
