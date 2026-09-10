---
"@macrostrat/data-provider": minor
"@macrostrat/map-views": patch
"@macrostrat/api-types": patch
---

Require an explicit project scope for column requests. `fetchAllColumns` used to
send `all=true` when no project was given, which `/columns` silently ignores —
the request fell through to the API's core-projects default, so entire projects
(GBDB's 28,951 columns among them) were absent with nothing to indicate it.
`projectID` is now required and accepts an id, a list, a comma-joined string, or
`"all"`; `CORE_COLUMNS_PROJECT_ID` names the API's old implicit default, and the
map components pass it when given no project.

Also fixes the in-process filter in `useMacrostratColumns`, which assigned to
`.features` on what is already an array — so it never filtered, and mutated the
cache while not doing it. Column features now carry `status`, added to the
`/columns` response in API v2 2.3.10.
