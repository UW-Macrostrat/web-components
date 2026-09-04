---
"@macrostrat/feedback-components": minor
---

Feedback editor: a consistent interaction model across the paragraph, tree and graph views, and fixes for consumers outside the development database.

- **Explicit tagging.** Selecting text no longer creates an entity on `mouseup`. A small control appears under the selection to confirm ("Tag as _type_"), pick another type, or dismiss; Enter confirms, Escape dismisses. The old behavior is available with `autoCreateTags`.
- **Merge entities.** Select two or more entities (cmd/ctrl-click or shift-click in any view) and press **M** or the "Merge N entities" button: the shallowest node survives with every span (`spans`) and child of the others, and takes a match if it had none. `treeToGraph` emits all spans as `txt_range`; input entities may carry `spans` too.
- **Same gestures everywhere.** Click selects, cmd/ctrl toggles, shift extends a range, clicking the background (paragraph or graph) or Escape clears, Backspace/Delete removes — now in the graph view as well as the paragraph.
- **Configurable match search.** `termsEndpoint` prop (default: the development `kg_macrostrat_terms` route) replaces the hard-coded `dev.macrostrat.org` URL.
- **Stable panel size.** The tree/graph panel has a definite height (`panelHeight` prop or `--feedback-panel-height`), measured on an inner element, instead of growing on every measurement of its own padded box.
- New input data replaces the working tree without remounting; `FeedbackComponentProps` and `EntityOutput` are exported; stray `console.log`s removed.
