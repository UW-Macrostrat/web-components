# @macrostrat/vike-navigation

Route-aware breadcrumbs and page headers for [Vike](https://vike.dev) apps,
extracted from the Macrostrat website. Each page names its crumb with a
`pageInfo` config; the trail and title follow from the route. Rendering is
`PageHeader` from `@macrostrat/ui-components`.

```ts
import "@macrostrat/vike-navigation/style.css";
```

## Wiring a Vike app

1. **Root `+config.ts`**: load `pageInfo` eagerly on both sides and send the
   trail to the client.

   ```ts
   import {
     navigationMeta,
     navigationPassToClient,
   } from "@macrostrat/vike-navigation";

   export default {
     passToClient: [...navigationPassToClient /* … */],
     meta: { ...navigationMeta /* … */ },
   };
   ```

2. **`+onCreatePageContext.server.ts`**: match a page at each ancestor URL.

   ```ts
   import { getBreadcrumbs } from "@macrostrat/vike-navigation";
   pageContext.breadcrumbs = await getBreadcrumbs(pageContext);
   ```

3. **`+Layout`**: set the site's name and logo once.

   ```ts
   h(
     SiteNavigationProvider,
     {
       siteName: "Rockd",
       logo: h(SiteLogoLink, { src: "/rockd-icon-256.png" }),
     },
     children,
   );
   ```

4. **Pages** declare `+pageInfo.ts`: an object or a function of the page
   context.

   ```ts
   export default (ctx) => ({
     name: "Mancos Shale", // the crumb, and the single-row title
     title: "Mancos Shale Formation", // the large title
     identifier: Number(ctx.routeParams.id),
   });
   ```

   `name` may also be a function of the URL slug, so one `pageInfo` can label a
   whole subtree (`/docs/*`). Ancestors without a page are skipped; slugs
   without a `pageInfo` name are capitalized.

## Components

- `SitePageHeader`: the page header (`expanded`, `compact` or `hybrid`), with
  the page's `headerActions` config leading the action slot.
- `PageBreadcrumbs`: the trail alone, for a navbar or map panel.
- `Link`: an anchor marked `is-active` on the current page.
- `usePageBreadcrumbs`, `usePageItem`, `usePageTitle`: the resolved trail.
- `buildBreadcrumbs`, `pageHeaderContent`: the same as pure functions, for
  rendering outside Vike (pass `items` to `SitePageHeader`).

Stories: **Vike navigation → Site page header**, including a contact sheet of
every case.
