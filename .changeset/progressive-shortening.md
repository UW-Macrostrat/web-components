---
"@macrostrat/ui-components": minor
---

Add progressive text shortening (`Shortener`, `shortenedForms`,
`composeShorteners`, `fittingFormIndex`, and standard `dropParenthetical`,
`dropAfter`, `dropPrefix`, `dropSuffix` shorteners), and use it for
`PageHeader`'s inline title via `shortTitle` (string, list or shortener) and
`shortenTitle` (`never` | `narrow` | `always`). The expanded title now scales with the header's width (`--page-header-title-min-font-size`)
