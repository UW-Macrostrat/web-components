# Feedback components

Components for user feedback and assessment of (often AI-extracted) information.

## Model and version details

`ModelInfo` displays the model name and version name. The model links to its URL
when one is provided. Without a URL, its description appears in a Blueprint
tooltip; without either, it is plain text. Hovering or focusing a version shows
its description in a Blueprint tooltip, if present.

Pass a row from `https://dev.macrostrat.org/api/pg/kg_model_details` directly as
`data`, or pass a legacy model object with `model_id` (or `id`) and `version_id`.
Legacy objects load metadata from that endpoint, filtered by both IDs.
`enhanceData(run, models, entityTypes)` now carries the run's IDs into `data.model`,
so existing consumers passing that model to `FeedbackComponent` resolve the
correct version without changes. Without a version ID, only model metadata is
fetched; no version is guessed. Failed requests leave the supplied data visible.

```ts
h(ModelInfo, { data: { model_id: 7, version_id: 229 } });
// Or pass the complete API row, with no additional fetch:
h(ModelInfo, { data: modelDetailsRow });
```

`ModelInfo`, `FeedbackComponent`, and `ExtractionContext` accept
`modelDetailsEndpoint` to override the route for another deployment, or `null`
to disable metadata requests. When supplying `FeedbackComponent.model` directly
without `enhanceData`, include `version_id` or the resolved version fields.
See **Text extractions → Model info** for link, tooltip, plain-text, legacy and
live-lookup examples.

## Entity feedback with multiple parents

`FeedbackComponent` replaces its tree/graph panel with a KG view where an entity
can have multiple parents. Connections are directed and unlabeled; no
relationship type is required. The paragraph renderer, highlighting, text
tagging, merged spans, entity-type picker, match search and lexicon links retain
their existing behavior.

Select entities to edit their types or matches, or tag new spans in the
paragraph. **Save** submits entity and connection edits; **Reset** restores the
input. Dragging nodes only changes the layout. Deleting an entity removes its
incident connections; merging entities redirects connections to the surviving
entity.

- Turn on **Relationship mode**, then click the source entity and the destination.
  The connection is added immediately to the working graph. The source is
  highlighted; the mode stays on so you can connect another pair. Node dragging
  is disabled while picking endpoints, and connection edits keep the layout
  steady.
- Click an arrow to reveal **Delete connection**, **Change source**, and
  **Change destination**. To move an endpoint, choose its action and click the
  replacement entity. Deleting a connection preserves its entities.
- Keyboard users can focus an entity or arrow and press Enter/Space. Delete or
  Backspace removes a focused arrow, or the selected connection when the canvas
  is focused. Escape, **Cancel**, or clicking the background exits connection
  mode.
- **Save** persists the changes through the existing callback. Duplicate
  directed connections and connections to the same entity are rejected. Multiple
  parents, reverse edges, and cycles between distinct entities are allowed. View
  mode disables editing.

```ts
h(FeedbackComponent, {
  entities,
  text: paragraph_text,
  entityTypes,
  relationships: [
    { id: "r1", source: 1, dest: 3 },
    { id: "r2", source: 2, dest: 3 }, // Entity 3 has two parents.
  ],
  onSaveGraph: async (graph) => {
    await saveGraph(graph); // Your persistence callback; throw on failure.
  },
});
```

Relationship IDs are unique within a run; endpoints reference entity IDs. Omit
`relationships` to import legacy tree children, or pass `[]` for an explicitly
edgeless graph. Supply the original edge list when available so an upstream tree
conversion does not lose additional parents. Repeated node IDs are displayed
once, with all their incoming connections.

Self-loops are hidden. Multiple records on the same directed pair are displayed
as one connection. Moving or deleting that connection updates all records for
the directed pair. Moves retain their IDs and type metadata; new connections
contain only an ID and their endpoints. Untouched records pass through saves,
including hidden self-loops. The interface does not request, show, or modify
relationship-type feedback. The old `relationshipTypes` prop is accepted but
ignored for compatibility.

`onSaveGraph(graph)` receives `{ nodes, edges }` and takes precedence over
`onSave`. Existing `onSave(tree)` consumers can keep calling the updated
`treeToGraph(tree)`: explicit outgoing `relationships` metadata preserves all
parents and original edge metadata. The optional second `onSave(tree, graph)`
argument contains the same graph. Do not reconstruct connections solely from
`children` or save the filtered display projection. `GraphData.nodes[].children`
is empty; use `edges`. Saves are handled by the consumer; model metadata and
term matching can make read-only API requests.

## Stories and checks

Run `yarn dev` and open **Text extractions → Knowledge graph editor → Multiple
Parents**. Sandstone and shale both point to one Quartz entity; the example also
includes repeated text spans and a matched lithology. Input data and the last
saved JSON are shown. Companion Stories cover read-only mode, an edgeless start
and a rejected save that retains edits. They do not write to an API.

```bash
yarn node --import tsx --test packages/feedback-components/tests/relationships.test.ts
yarn check-types
```

The monorepo has existing type errors; inspect diagnostics for changed files.
