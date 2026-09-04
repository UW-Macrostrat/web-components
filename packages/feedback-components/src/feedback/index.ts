import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

import { Tree, TreeApi } from "react-arborist";
import Node from "./node";
import { FeedbackText } from "./text-visualizer";
import type { InternalEntity, TreeData } from "./types";
import type { Entity } from "../extractions";
import type { EntityType } from "../extractions/types";
import { getTagStyle, ModelInfo } from "../extractions";
import {
  TreeDispatchContext,
  treeToGraph,
  useUpdatableTree,
  ViewMode,
} from "./edit-state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  SegmentedControl,
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
  FlexRow,
  SaveButton,
} from "@macrostrat/ui-components";
import useElementDimensions from "use-element-dimensions";
import { GraphView } from "./graph";

import { Matches } from "./matches";
import { TypeList } from "./typelist";

export type { GraphData, EntityOutput } from "./edit-state";
export { treeToGraph, mergeNodes, spansOf } from "./edit-state";
export type { TreeData } from "./types";
export type { FeedbackConfig } from "./config";
export { DEFAULT_TERMS_ENDPOINT } from "./config";

const h = hyper.styled(styles);

function setsAreTheSame<T>(a: Set<T>, b: Set<T>) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

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
  /** Called with the edited tree when the reviewer saves. */
  onSave?: (tree: TreeData[]) => void | Promise<void>;
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
  /** Height of the tree/graph panel (CSS length). Defaults to `min(600px, 60vh)`. */
  panelHeight?: string | number;
  /** Create an entity as soon as text is selected, without the confirmation
   * control (the pre-2.3 behavior). */
  autoCreateTags?: boolean;
}

// A stable default so an omitted `entities` prop does not read as new input on
// every render (which would replace the working tree each time).
const NO_ENTITIES: Entity[] = [];

export function FeedbackComponent({
  entities = NO_ENTITIES,
  text,
  model,
  entityTypes,
  matchComponent,
  onSave,
  allowOverlap,
  matchLinks,
  view = false,
  autoSelect = [],
  termsEndpoint = DEFAULT_TERMS_ENDPOINT,
  panelHeight,
  autoCreateTags = false,
}: FeedbackComponentProps) {
  const [viewOnly, setViewOnly] = useState(view);
  const [match, setMatchLinks] = useState(matchLinks);

  const initialTree = useMemo(
    () => entities.map((entity) => processEntity(entity, entityTypes)) as any,
    [entities, entityTypes],
  );

  // Get the input arguments
  const [state, dispatch] = useUpdatableTree(
    initialTree,
    entityTypes,
    viewOnly,
    autoSelect,
  );

  // New input (another run, or reloaded data) replaces the working tree, so a
  // consumer need not remount the component per run.
  const isFirstTree = useRef(true);
  useEffect(() => {
    if (isFirstTree.current) {
      isFirstTree.current = false;
      return;
    }
    dispatch({ type: "replace-tree", payload: { tree: initialTree } });
  }, [initialTree]);

  const config: FeedbackConfig = useMemo(
    () => ({ termsEndpoint }),
    [termsEndpoint],
  );

  let panelStyle = undefined;
  if (panelHeight != null) {
    panelStyle = { "--feedback-panel-height": panelHeight } as any;
  }

  const {
    selectedNodes,
    tree,
    selectedEntityType,
    isSelectingEntityType,
    entityTypesMap,
  } = state;

  const [{ width, height }, ref] = useElementDimensions();

  const canMerge = !viewOnly && selectedNodes.length > 1;

  return h(FeedbackConfigContext.Provider, { value: config }, h("div.page-wrapper", [
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
            setViewOnly(!viewOnly);
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
        h(
          FlexRow,
          { alignItems: "baseline", justifyContent: "space-between" },
          [
            h(ModelInfo, { data: model }),
            h(SegmentedControl, {
              options: [
                { label: "Tree", value: "tree" },
                { label: "Graph", value: "graph" },
              ],
              value: state.viewMode,
              small: true,
              onValueChange(value: ViewMode) {
                dispatch({ type: "set-view-mode", payload: value });
              },
            }),
          ],
        ),
        h(
          "div.entity-panel",
          { style: panelStyle },
          h("div.entity-panel-inner", { ref }, [
            h.if(state.viewMode == "tree")(ManagedSelectionTree, {
              selectedNodes,
              dispatch,
              tree,
              width,
              height,
              matchComponent,
              matchLinks: match,
              viewOnly,
            }),
            h.if(state.viewMode == "graph")(GraphView, {
              tree,
              width,
              height,
              dispatch,
              selectedNodes,
              viewOnly,
            }),
          ]),
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
                disabled: state.initialTree == state.tree,
                onClick() {
                  dispatch({ type: "reset" });
                },
              },
              "Reset",
            ),
            h(
              SaveButton,
              {
                onClick() {
                  onSave(state.tree);
                },
                disabled: state.initialTree == state.tree,
              },
              "Save",
            ),
          ],
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
  ]));
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

function processEntity(entity: Entity, entityTypes: Map<number, EntityType>): InternalEntity {
  const type = typeof entity.type === "number" ? entityTypes.get(entity.type) : entity.type;

  return {
    ...entity,
    type: type ?? { id: -1, name: "unknown", description: null, color: "#999" },
    term_type: type?.name ?? "unknown",
    txt_range: entity.spans ?? [entity.indices],
    match: normalizeMatch(entity.match),
    children: entity.children?.map((child) => processEntity(child, entityTypes)) ?? [],
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
  const types = Array.from(entityTypes.values());

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

function countNodes(tree) {
  if (!tree) return 0;
  let count = 0;

  function recurse(nodes) {
    for (const node of nodes) {
      count++;
      if (node.children && Array.isArray(node.children)) {
        recurse(node.children);
      }
    }
  }

  recurse(tree);
  return count;
}

function ManagedSelectionTree(props) {
  const {
    selectedNodes,
    dispatch,
    tree,
    height,
    width,
    matchComponent,
    matchLinks,
    viewOnly,
  } = props;

  const ref = useRef<TreeApi<TreeData>>();
  // Use a ref to track clicks (won't cause rerender)
  const clickedRef = useRef(false);

  const _Node = useCallback(
    (props) => h(Node, { ...props, matchComponent, matchLinks, viewOnly }),
    [matchComponent, matchLinks, viewOnly],
  );

  // Update Tree selection when selectedNodes change
  useEffect(() => {
    if (ref.current == null) return;

    const selection = new Set(selectedNodes.map((d) => d.toString()));
    const currentSelection = ref.current.selectedIds;
    if (setsAreTheSame(selection, currentSelection)) return;

    ref.current.setSelection({
      ids: selectedNodes.map((d) => d.toString()),
      anchor: null,
      mostRecent: null,
    });
  }, [selectedNodes]);

  // Mark clicked when user clicks inside the tree container
  function handleClick() {
    clickedRef.current = true;
  }

  const ctrlPressedRef = useRef(false);

  useEffect(() => {
    const down = (e) => {
      if (e.ctrlKey || e.metaKey) ctrlPressedRef.current = true;
    };
    const up = () => (ctrlPressedRef.current = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handleSelect = useCallback(
    (nodes) => {
      if (!clickedRef.current) return;
      clickedRef.current = false;
      const isMultiSelect = ctrlPressedRef.current;

      let ids = nodes.map((d) => parseInt(d.id));

      if (isMultiSelect) {
        dispatch({ type: "toggle-node-selected", payload: { ids } });
      } else {
        if (ids.length === 1 && ids[0] === selectedNodes[0]) {
          ids = [];
        }

        dispatch({ type: "select-node", payload: { ids } });
      }
    },
    [selectedNodes, dispatch],
  );

  return h(
    "div.selection-tree-wrapper",
    { onPointerDown: handleClick },
    h(Tree, {
      className: "selection-tree",
      height,
      width,
      ref,
      data: tree,
      onMove({ dragIds, parentId, index }) {
        dispatch({
          type: "move-node",
          payload: {
            dragIds: dragIds.map((d) => parseInt(d)),
            parentId: parentId ? parseInt(parentId) : null,
            index,
          },
        });
      },
      onDelete({ ids }) {
        dispatch({
          type: "delete-node",
          payload: { ids: ids.map((d) => parseInt(d)) },
        });
      },
      onSelect: handleSelect,
      children: _Node,
      idAccessor(d) {
        return d.id.toString();
      },
    }),
  );
}
