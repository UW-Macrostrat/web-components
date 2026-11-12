# Feedback components

Components for user feedback and assessment of (often AI-extracted) information.

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
is empty; use `edges`. No API requests are made by the component itself.

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
