import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

import { FeedbackText } from "./text-visualizer";
import type { InternalEntity, TreeData } from "./types";
import type { Entity } from "../extractions";
import type { EntityType } from "../extractions/types";
import { ModelInfo, type MatchComponent } from "../extractions";
import {
  TreeDispatchContext,
  treeToGraph,
  useUpdatableTree,
  type GraphData,
} from "./edit-state";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  SegmentedControl,
  Callout,
  Divider,
} from "@blueprintjs/core";
import {
  DEFAULT_TERMS_ENDPOINT,
  FeedbackConfigContext,
  type FeedbackConfig,
} from "./config";
import { OmniboxSelector } from "./type-selector";
import {
  CancelButton,
  ErrorBoundary,
  SaveButton,
} from "@macrostrat/ui-components";
import { KGEditor } from "./kg-editor";
import {
  type Relationship,
  type RelationshipType,
  treeWithRelationships,
} from "./relationships";

import { Matches } from "./matches";
import { TypeList } from "./typelist";

export type { GraphData, EntityOutput } from "./edit-state";
export type {
  Relationship,
  RelationshipID,
  RelationshipType,
} from "./relationships";
export { treeToGraph, mergeNodes, spansOf } from "./edit-state";
export type { TreeData } from "./types";
export type { FeedbackConfig } from "./config";
export { DEFAULT_TERMS_ENDPOINT } from "./config";

const h = hyper.styled(styles);

export interface FeedbackComponentProps {
  /** The run's entity tree (`type` as an entity-type id or object). */
  entities?: Entity[];
  /** The paragraph the entities were extracted from. */
  text: string;
  /** The model that produced the run (shown under the text). */
  model?: any;
  entityTypes: Map<number, EntityType>;
  /** Renders a matched entity's link in the tree (legacy; prefer `matchLinks`). */
  matchComponent?: MatchComponent;
  /** Directed edges; when omitted, legacy children are imported as untyped
   * edges. Pass [] to explicitly start with no relationships. */
  relationships?: Relationship[];
  /** Suggested relationship types; unlisted names can also be entered. */
  relationshipTypes?: RelationshipType[];
  /** Existing consumers can keep calling treeToGraph(tree): outgoing edge
   * metadata preserves types and cycles. The second argument is the same graph. */
  onSave?: (tree: TreeData[], graph: GraphData) => void | Promise<void>;
  /** Preferred graph-native save callback. Takes precedence over onSave. */
  onSaveGraph?: (graph: GraphData) => void | Promise<void>;
  /** Allow a new tag to overlap or nest inside an existing one. */
  allowOverlap?: boolean;
  /** Lexicon route prefixes for matched entities, keyed by term type. */
  matchLinks?: Record<string, string>;
  /** Read-only: no editing controls, matched entities link to the lexicon. */
  view?: boolean;
  /** Entity names to pre-select. */
  autoSelect?: string[];
  /** PostgREST route of the terms view searched by "Add match". Defaults to the
   * development database; pass your deployment's route (`null` disables). */
  termsEndpoint?: string | null;
  /** Height of the KG editor panel (CSS length). Defaults to `min(600px, 60vh)`. */
  panelHeight?: string | number;
  /** Create an entity as soon as text is selected, without the confirmation
   * control (the pre-2.3 behavior). */
  autoCreateTags?: boolean;
}

// A stable default so an omitted `entities` prop does not read as new input on
// every render (which would replace the working tree each time).
const NO_ENTITIES: Entity[] = [];
const NO_RELATIONSHIP_TYPES: RelationshipType[] = [];

export function FeedbackComponent({
  entities = NO_ENTITIES,
  text,
  model,
  entityTypes,
  matchComponent,
  onSave,
  onSaveGraph,
  relationships,
  relationshipTypes = NO_RELATIONSHIP_TYPES,
  allowOverlap,
  matchLinks,
  view = false,
  autoSelect = [],
  termsEndpoint = DEFAULT_TERMS_ENDPOINT,
  panelHeight,
  autoCreateTags = false,
}: FeedbackComponentProps) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [match, setMatchLinks] = useState(matchLinks);

  const initialTree = useMemo(
    () => entities.map((entity) => processEntity(entity, entityTypes)) as any,
    [entities, entityTypes],
  );

  // Get the input arguments
  const [state, dispatch] = useUpdatableTree(
    initialTree,
    entityTypes,
    view,
    autoSelect,
    relationships,
  );

  // New input (another run, or reloaded data) replaces the working tree, so a
  // consumer need not remount the component per run.
  //
  // Keyed on the tree we last rendered, not on a "first run" flag: under
  // StrictMode an effect is invoked, cleaned up, and invoked again on mount, so
  // a flag consumed by the first invocation makes the second one replace the
  // tree — discarding the mount-time state, including any `autoSelect`.
  // Comparing identities makes the effect idempotent.
  const renderedTree = useRef(initialTree);
  const renderedRelationships = useRef(relationships);
  useEffect(() => {
    if (
      renderedTree.current === initialTree &&
      renderedRelationships.current === relationships
    )
      return;
    renderedTree.current = initialTree;
    renderedRelationships.current = relationships;
    setSaveError(null);
    dispatch({
      type: "replace-tree",
      payload: { tree: initialTree, relationships, entityTypes },
    });
  }, [initialTree, relationships, entityTypes]);
  useEffect(() => {
    dispatch({ type: "set-view-only", payload: view });
  }, [view]);

  const config: FeedbackConfig = useMemo(
    () => ({ termsEndpoint }),
    [termsEndpoint],
  );

  let panelStyle = undefined;
  if (panelHeight != null) {
    let value = panelHeight;
    if (typeof value === "number") value = `${value}px`;
    panelStyle = { "--feedback-panel-height": value } as any;
  }

  const {
    selectedNodes,
    tree,
    selectedEntityType,
    isSelectingEntityType,
    entityTypesMap,
    viewOnly,
  } = state;
  const dirty =
    state.initialTree !== state.tree ||
    state.initialRelationships !== state.relationships;

  async function save() {
    if (savingRef.current || (!onSave && !onSaveGraph)) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const graph = treeToGraph(state.tree, state.relationships);
      if (onSaveGraph) await onSaveGraph(graph);
      else
        await onSave(
          treeWithRelationships(state.tree, state.relationships),
          graph,
        );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const canMerge = !viewOnly && selectedNodes.length > 1;

  return h(
    FeedbackConfigContext.Provider,
    { value: config },
    h("div.page-wrapper", { inert: saving, "aria-busy": saving }, [
      h(
        "div.feedback-container",
        h(TreeDispatchContext.Provider, { value: dispatch }, [
          h.if(!view)(SegmentedControl, {
            options: [
              { label: "View", value: "view" },
              { label: "Edit", value: "edit" },
            ],
            value: viewOnly ? "view" : "edit",
            small: true,
            onValueChange() {
              dispatch({ type: "toggle-view-only" });
            },
            role: "toolbar",
          }),
          h(
            ErrorBoundary,
            {
              description:
                "An error occurred while rendering the feedback text component.",
            },
            h(FeedbackText, {
              text,
              dispatch,
              // @ts-ignore
              nodes: tree,
              selectedNodes,
              selectedEntityType,
              allowOverlap,
              matchLinks: match,
              viewOnly,
              autoCreateTags,
            }),
          ),
          h(ModelInfo, { data: model }),
          h(
            "div.entity-panel",
            { style: panelStyle },
            h(KGEditor, {
              tree,
              relationships: state.relationships,
              relationshipTypes,
              dispatch,
              selectedNodes,
              viewOnly,
              matchComponent,
              matchLinks: match,
              resetKey: state.initialTree,
            }),
          ),
        ]),
      ),
      h(Card, { className: "control-panel" }, [
        h("div.control-content", [
          h.if(!viewOnly)(
            ButtonGroup,
            {
              vertical: true,
              fill: true,
              minimal: true,
              alignText: "left",
            },
            [
              h(
                CancelButton,
                {
                  icon: "trash",
                  disabled: !dirty,
                  onClick() {
                    setSaveError(null);
                    dispatch({ type: "reset" });
                  },
                },
                "Reset",
              ),
              h(
                SaveButton,
                {
                  onClick: save,
                  loading: saving,
                  disabled: !dirty || (!onSave && !onSaveGraph),
                },
                "Save",
              ),
            ],
          ),
          h.if(saveError != null)(
            Callout,
            { intent: "danger", title: "Feedback was not saved" },
            saveError,
          ),
          h.if(canMerge)(
            Button,
            {
              className: "merge-button",
              icon: "git-merge",
              fill: true,
              minimal: true,
              alignText: "left",
              title: "Combine the selected entities into one (M)",
              onClick() {
                dispatch({ type: "merge-nodes" });
              },
            },
            `Merge ${selectedNodes.length} entities`,
          ),
          h.if(!viewOnly)(Matches, {
            match,
            setMatchLinks,
            matchLinks,
            selectedNodes,
            tree,
            dispatch,
          }),
          h.if(!viewOnly)(Divider),
          h(EntityTypeSelector, {
            entityTypes: entityTypesMap,
            selected: selectedEntityType,
            onChange(payload) {
              dispatch({ type: "select-entity-type", payload });
            },
            dispatch,
            tree,
            selectedNodes,
            isOpen: isSelectingEntityType,
            setOpen: (isOpen: boolean) =>
              dispatch({
                type: "toggle-entity-type-selector",
                payload: isOpen,
              }),
            viewOnly,
          }),
        ]),
      ]),
    ]),
  );
}

function normalizeMatch(match: any) {
  if (match == null) return match;

  const entity_id =
    match.entity_id ??
    match.macrostrat_terms_id ??
    match.strat_name_id ??
    match.lith_id ??
    match.concept_id ??
    match.lith_att_id ??
    match.interval_id;

  return entity_id != null ? { ...match, entity_id } : match;
}

function processEntity(
  entity: Entity,
  entityTypes: Map<number, EntityType>,
): InternalEntity {
  const type =
    typeof entity.type === "number"
      ? entityTypes.get(entity.type)
      : entity.type;

  return {
    ...entity,
    orig_id: entity.id,
    type: type ?? { id: -1, name: "unknown", description: null, color: "#999" },
    term_type: type?.name ?? "unknown",
    txt_range: entity.spans ?? [entity.indices],
    match: normalizeMatch(entity.match),
    children:
      entity.children?.map((child) => processEntity(child, entityTypes)) ?? [],
  } as InternalEntity;
}

function EntityTypeSelector({
  entityTypes,
  selected,
  isOpen,
  setOpen,
  onChange,
  tree,
  dispatch,
  selectedNodes = [],
  viewOnly,
}) {
  // Show all entity types when selected is null
  const _selected = selected != null ? selected : undefined;
  const [inputValue, setInputValue] = useState("");
  const types = Array.from(entityTypes.values()) as EntityType[];

  const items =
    inputValue !== ""
      ? types.filter((d) =>
          d.name.toLowerCase().includes(inputValue.toLowerCase()),
        )
      : types;

  return h("div.entity-type-selector", [
    h(TypeList, {
      types: entityTypes,
      selected: _selected,
      dispatch,
      selectedNodes,
      tree,
      viewOnly,
    }),
    h(OmniboxSelector, {
      isOpen,
      items,
      selectedItem: _selected,
      onSelectItem(item) {
        setOpen(false);
        onChange(item);
      },
      onQueryChange(query) {
        setInputValue(query);
      },
      onClose() {
        setOpen(false);
      },
    }),
  ]);
}
