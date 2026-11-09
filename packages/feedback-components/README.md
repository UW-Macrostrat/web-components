# Feedback components

Components for user feedback and assessment of (often AI-extracted) information

## Knowledge graph feedback

`FeedbackComponent` replaces its tree/graph panel with a custom directed graph
editor. The paragraph renderer, text selection/tagging, merged spans, entity
type picker, match search and lexicon links use the existing components.
Paragraph annotation children are retained as highlighting context; graph
topology is stored independently and never recursively rendered as children.

Select an arrow or relationship row to correct its source, target or type.
Choose a suggested type or enter a custom name, then **Apply relationship**.
**Save** submits the complete edited graph; **Reset** restores the input.
Deleting a relationship leaves its entities intact. Deleting an entity removes
its incident edges. Merging entities redirects both endpoints and retains any
resulting self loops. Multiple parents, reciprocal edges and different typed
edges on the same pair are supported. Exact duplicate relationships are
rejected.

```ts
import {
  FeedbackComponent,
  type GraphData,
} from "@macrostrat/feedback-components";
import "@macrostrat/feedback-components/style.css";

h(FeedbackComponent, {
  entities, // Existing paragraph entities with IDs, indices, spans and matches.
  text: paragraph_text,
  entityTypes, // Map<number, EntityType>, as before.
  relationships: [
    {
      id: "r1",
      source: 1,
      dest: 2,
      relationship_type: "strat_name_to_lith",
      relationship_type_id: 7,
    },
    {
      id: "r2",
      source: 2,
      dest: 1,
      relationship_type: "occurs_in",
      relationship_type_id: 8,
    },
  ],
  relationshipTypes: [
    {
      id: 7,
      name: "strat_name_to_lith",
      description: "Formation has lithology",
    },
    { id: 8, name: "occurs_in", description: "Entity occurs in formation" },
  ],
  onSaveGraph: async (graph: GraphData) => {
    await saveGraph(graph); // Your persistence callback; throw on failure.
  },
});
```

Edge IDs must be unique within a run; `source` and `dest` reference entity IDs.
Relationship-type IDs in this example and the Stories are illustrative. Supply
the actual vocabulary IDs from your API. A custom name gets a null type ID, so
the save consumer must resolve or validate it if its API requires an ID.

Omit `relationships` to import old tree children as untyped edges, or pass `[]`
for an explicitly edgeless graph. Pass the original edge list to preserve
relationships that an upstream tree projection would discard. Do not encode a
cycle by making `children` refer back to an ancestor.

`onSaveGraph(graph)` receives `{ nodes, edges }` and takes precedence over
`onSave`. Existing `onSave(tree)` consumers that call **the updated**
`treeToGraph(tree)` still receive every edge and its type: each saved entity
carries explicit outgoing `relationships` metadata. An optional second
`onSave(tree, graph)` argument contains the graph directly. Serializing and
reloading the annotated tree also preserves edges; edge ordering may change.
Code that reconstructs edges solely from `children` must instead use the graph
callback or updated converter. `GraphData.nodes[].children` is empty; use
`edges` for topology. No API requests are made by the editor's save callback
itself.

For `UW-Macrostrat/web`, `feedback-api.ts` already calls `treeToGraph` for
create and overwrite. Updating this package therefore includes edge metadata in
those request payloads. The app must additionally pass the run's original
relationships and relationship vocabulary to the component to display their
existing types/cycles. The graph API must accept and persist `relationship_type`
and/or `relationship_type_id`; this component patch does not change or validate
that server contract.

## Stories and checks

Run `yarn dev` and open **Text extractions → Knowledge graph editor → Cycles And
Relationship Feedback**. The Story shows synthetic input data and the last saved
JSON. It includes a three-node cycle, two parents for one entity, reciprocal and
parallel typed edges, a self loop, repeated text spans and a matched lithology.
Companion Stories cover read-only mode, an edgeless start and a rejected save
that retains edits. They do not write to an API.

```bash
yarn node --import tsx --test packages/feedback-components/tests/kg-editor.test.ts
yarn check-types
```

The monorepo has existing type errors; inspect diagnostics for changed files.
