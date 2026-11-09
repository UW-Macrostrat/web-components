import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  buildHighlights,
  EntityTag,
  type MatchComponent,
} from "../extractions";
import type { TreeData } from "./types";
import type { TreeDispatch } from "./edit-state";
import {
  type Relationship,
  type RelationshipID,
  type RelationshipType,
  relationshipError,
  uniqueEntities,
} from "./relationships";
import {
  edgeGeometry,
  initialPositions,
  NODE_HEIGHT,
  NODE_WIDTH,
  type Point,
} from "./kg-layout";
import styles from "./kg-editor.module.sass";

const h = hyper.styled(styles);

interface KGEditorProps {
  tree: TreeData[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  selectedNodes: number[];
  dispatch: TreeDispatch;
  viewOnly: boolean;
  matchComponent?: MatchComponent;
  matchLinks?: Record<string, string>;
  resetKey: unknown;
}

/** Graph edits never reparent paragraph annotations. Cycles, self loops,
 * reciprocal edges and multiple relationship types per pair are all allowed. */
export function KGEditor(props: KGEditorProps) {
  const {
    tree,
    relationships,
    relationshipTypes,
    selectedNodes,
    dispatch,
    viewOnly,
    matchComponent,
    matchLinks,
    resetKey,
  } = props;
  const nodes = useMemo(() => uniqueEntities(tree), [tree]);
  const highlights = useMemo(() => buildHighlights(tree, null), [tree]);
  // Reuse the paragraph's selected-entity/parent context for visual emphasis.
  const highlightedIDs = new Set(
    highlights
      .filter(
        (tag) =>
          selectedNodes.length === 0 ||
          selectedNodes.includes(tag.id) ||
          tag.parents?.some((id) => selectedNodes.includes(id)),
      )
      .map((tag) => tag.id),
  );
  const [selectedId, setSelectedId] = useState<RelationshipID | null>(null);
  const [adding, setAdding] = useState(false);
  const selected = relationships.find((edge) => edge.id === selectedId);

  useEffect(() => {
    setSelectedId(null);
    setAdding(false);
  }, [resetKey]);
  useEffect(() => {
    if (viewOnly) setAdding(false);
  }, [viewOnly]);

  function selectEdge(edge: Relationship) {
    setSelectedId(edge.id);
    setAdding(false);
    dispatch({
      type: "select-node",
      payload: { ids: [...new Set([edge.source, edge.dest])] },
    });
  }

  function selectNode(
    id: number,
    event: React.MouseEvent | React.KeyboardEvent,
  ) {
    setSelectedId(null);
    setAdding(false);
    if (viewOnly) return;
    if (
      event.ctrlKey ||
      event.metaKey ||
      (selectedNodes.length === 1 && selectedNodes[0] === id)
    ) {
      dispatch({ type: "toggle-node-selected", payload: { ids: [id] } });
    } else if (event.shiftKey && selectedNodes.length > 0) {
      dispatch({
        type: "select-range",
        payload: { ids: [selectedNodes[selectedNodes.length - 1], id] },
      });
    } else {
      dispatch({ type: "select-node", payload: { ids: [id] } });
    }
  }

  const nodeIndex = new Map(nodes.map((node) => [node.id, node]));
  const labelFor = (id: number) =>
    nodeIndex.get(id)?.name ?? `Missing entity #${id}`;

  return h("section.kg-editor", { "aria-label": "Knowledge graph editor" }, [
    h("div.kg-toolbar", [
      h("strong", "Knowledge graph"),
      h(
        "span.kg-count",
        `${nodes.length} entities · ${relationships.length} relationships`,
      ),
      h.if(!viewOnly)(
        Button,
        {
          small: true,
          icon: "add",
          disabled: nodes.length === 0,
          onClick() {
            setSelectedId(null);
            setAdding(true);
          },
        },
        "Add relationship",
      ),
    ]),
    h("div.kg-body", [
      h(GraphCanvas, {
        nodes,
        relationships,
        selectedNodes,
        highlightedIDs,
        selectedId,
        selectNode,
        selectEdge,
        resetKey,
        onClear() {
          setSelectedId(null);
          setAdding(false);
          dispatch({ type: "deselect" });
        },
        onDelete() {
          if (viewOnly) return;
          if (selected != null) {
            dispatch({
              type: "delete-relationship",
              payload: { id: selected.id },
            });
            setSelectedId(null);
          } else {
            dispatch({ type: "delete-node", payload: { ids: selectedNodes } });
          }
        },
      }),
      h("aside.kg-inspector", [
        h.if(adding || selected != null)(RelationshipForm, {
          key: selectedId ?? "new",
          edge: selected,
          nodes,
          relationships,
          relationshipTypes,
          selectedNodes,
          viewOnly,
          dispatch,
          onDone(id: RelationshipID | null) {
            setSelectedId(id);
            setAdding(false);
          },
        }),
        h("h4", "Relationships"),
        h.if(relationships.length === 0)(
          "p.kg-help",
          "No relationships yet. Select entities and add a relationship.",
        ),
        h(
          "ul.kg-edge-list",
          relationships.map((edge) =>
            h(
              "li",
              { key: edge.id },
              h(
                "button.kg-edge-item",
                {
                  type: "button",
                  className: classNames({ active: edge.id === selectedId }),
                  "aria-pressed": edge.id === selectedId,
                  onClick: () => selectEdge(edge),
                },
                [
                  h(
                    "span.kg-edge-type",
                    edge.relationship_type ?? "Unspecified type",
                  ),
                  h(
                    "span",
                    `${labelFor(edge.source)} → ${labelFor(edge.dest)}`,
                  ),
                ],
              ),
            ),
          ),
        ),
        h("h4", "Entities"),
        h(
          "div.kg-entity-list",
          nodes.map((node) =>
            h(
              "div.kg-entity-item",
              {
                key: node.id,
                tabIndex: 0,
                role: "group",
                "aria-label": `Select ${node.name}`,
                onClick: (event) => selectNode(node.id, event),
                onKeyDown(event) {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectNode(node.id, event);
                  }
                },
              },
              h(EntityTag, {
                data: node,
                active: selectedNodes.includes(node.id),
                highlighted: highlightedIDs.has(node.id),
                matchComponent,
                matchLinks,
                onClickType() {
                  if (!viewOnly)
                    dispatch({ type: "toggle-entity-type-selector" });
                },
              }),
            ),
          ),
        ),
      ]),
    ]),
  ]);
}

interface RelationshipFormProps {
  edge?: Relationship;
  nodes: TreeData[];
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  selectedNodes: number[];
  viewOnly: boolean;
  dispatch: TreeDispatch;
  onDone(id: RelationshipID | null): void;
}

function RelationshipForm({
  edge,
  nodes,
  relationships,
  relationshipTypes,
  selectedNodes,
  viewOnly,
  dispatch,
  onDone,
}: RelationshipFormProps) {
  const formId = useId();
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [typeName, setTypeName] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setSource(String(edge?.source ?? selectedNodes[0] ?? nodes[0]?.id ?? ""));
    setDest(
      String(
        edge?.dest ??
          selectedNodes[1] ??
          selectedNodes[0] ??
          nodes[1]?.id ??
          nodes[0]?.id ??
          "",
      ),
    );
    setTypeName(edge?.relationship_type ?? "");
    setError(null);
  }, [edge]);

  const types = new Map<string, RelationshipType>(
    relationshipTypes.map((type) => [type.name, type]),
  );
  for (const item of relationships) {
    if (item.relationship_type && !types.has(item.relationship_type)) {
      types.set(item.relationship_type, {
        name: item.relationship_type,
        id: item.relationship_type_id ?? undefined,
      });
    }
  }

  function submit(event) {
    event.preventDefault();
    if (viewOnly) return;
    let id = edge?.id;
    if (id == null) {
      let index = 1;
      while (relationships.some((item) => item.id === `new:${index}`)) index++;
      id = `new:${index}`;
    }
    const type = types.get(typeName.trim());
    const payload: Relationship = {
      id,
      source: Number(source),
      dest: Number(dest),
      relationship_type: typeName.trim(),
      relationship_type_id: type?.id ?? null,
    };
    if (source === "" || dest === "") {
      setError("Choose a source and target.");
      return;
    }
    const problem = relationshipError(payload, nodes, relationships, edge?.id);
    if (problem) {
      setError(problem);
      return;
    }
    if (edge) dispatch({ type: "update-relationship", payload });
    else dispatch({ type: "add-relationship", payload });
    onDone(id);
  }

  const options = nodes.map((node) =>
    h(
      "option",
      { key: node.id, value: String(node.id) },
      `${node.name} (${node.type?.name ?? "entity"}, #${node.id})`,
    ),
  );
  let heading = "New relationship";
  if (edge) heading = "Relationship feedback";
  return h("form.kg-form", { onSubmit: submit }, [
    h("h4", heading),
    h("label", { htmlFor: `${formId}-source` }, "Source"),
    h<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
      "select",
      {
        id: `${formId}-source`,
        value: source,
        disabled: viewOnly,
        onChange: (event) => setSource(event.target.value),
      },
      options,
    ),
    h("label", { htmlFor: `${formId}-target` }, "Target"),
    h<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
      "select",
      {
        id: `${formId}-target`,
        value: dest,
        disabled: viewOnly,
        onChange: (event) => setDest(event.target.value),
      },
      options,
    ),
    h("label", { htmlFor: `${formId}-type` }, "Relationship type"),
    h("input", {
      id: `${formId}-type`,
      list: `${formId}-types`,
      value: typeName,
      disabled: viewOnly,
      placeholder: "Select or enter a type",
      required: true,
      onChange: (event) => setTypeName(event.target.value),
    }),
    h(
      "datalist",
      { id: `${formId}-types` },
      [...types.values()].map((type) =>
        h(
          "option",
          { key: type.name, value: type.name },
          type.description ?? type.name,
        ),
      ),
    ),
    h.if(error != null)("p.kg-error", { role: "alert" }, error),
    h.if(!viewOnly)(ButtonGroup, { small: true }, [
      h(Button, { type: "submit", intent: "primary" }, "Apply relationship"),
      h(Button, { type: "button", onClick: () => onDone(null) }, "Cancel"),
      h.if(edge != null)(Button, {
        type: "button",
        icon: "trash",
        intent: "danger",
        title: "Delete relationship",
        onClick() {
          if (edge)
            dispatch({ type: "delete-relationship", payload: { id: edge.id } });
          onDone(null);
        },
      }),
    ]),
  ]);
}

function GraphCanvas({
  nodes,
  relationships,
  selectedNodes,
  highlightedIDs,
  selectedId,
  selectNode,
  selectEdge,
  resetKey,
  onClear,
  onDelete,
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowId = `kg-arrow-${useId().replace(/:/g, "")}`;
  const [positions, setPositions] = useState<Map<number, Point>>(new Map());
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{
    id: number;
    start: Point;
    origin: Point;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    setPositions(new Map());
    setZoom(1);
  }, [resetKey]);
  const defaults = initialPositions(nodes.map((node) => node.id));
  const actual = new Map<number, Point>(
    nodes.map((node) => [
      node.id,
      positions.get(node.id) ?? defaults.get(node.id)!,
    ]),
  );
  // Keep the viewport fixed while dragging, then fit it explicitly if desired.
  const radius = Math.max(180, nodes.length * 35);
  const baseWidth = radius * 2 + 340;
  const baseHeight = radius * 2 + 260;
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  useEffect(() => setPan({ x: 0, y: 0 }), [resetKey]);
  const width = baseWidth / zoom;
  const height = baseHeight / zoom;

  function point(event): Point | null {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const transformed = p.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function fit() {
    if (actual.size === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const values = [...actual.values()];
    const left = Math.min(...values.map((p) => p.x)) - 180;
    const right = Math.max(...values.map((p) => p.x)) + 180;
    const top = Math.min(...values.map((p) => p.y)) - 170;
    const bottom = Math.max(...values.map((p) => p.y)) + 100;
    setZoom(Math.min(baseWidth / (right - left), baseHeight / (bottom - top)));
    setPan({
      x: (left + right) / 2 - baseWidth / 2,
      y: (top + bottom) / 2 - baseHeight / 2,
    });
  }

  return h("div.kg-canvas", [
    h("div.kg-canvas-controls", [
      h(ButtonGroup, { small: true }, [
        h(Button, {
          icon: "zoom-in",
          "aria-label": "Zoom in",
          onClick: () => setZoom((z) => Math.min(4, z * 1.2)),
        }),
        h(Button, {
          icon: "zoom-out",
          "aria-label": "Zoom out",
          onClick: () => setZoom((z) => Math.max(0.2, z / 1.2)),
        }),
        h(Button, { icon: "zoom-to-fit", onClick: fit }, "Fit"),
        h(
          Button,
          {
            icon: "layout",
            onClick() {
              setPositions(new Map());
              setZoom(1);
              setPan({ x: 0, y: 0 });
            },
          },
          "Arrange",
        ),
      ]),
      h(
        "span.kg-help",
        "Drag nodes · Click arrows to edit · Ctrl/⌘-click to select more",
      ),
    ]),
    h(
      "svg.kg-svg",
      {
        ref: svgRef,
        viewBox: `${baseWidth / 2 - width / 2 + pan.x} ${baseHeight / 2 - height / 2 + pan.y} ${width} ${height}`,
        tabIndex: 0,
        role: "group",
        "aria-label": "Directed knowledge graph",
        onClick(event) {
          if (event.target === event.currentTarget) onClear();
        },
        onKeyDown(event) {
          if (event.key === "Escape") onClear();
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            onDelete();
          }
        },
        onPointerMove(event) {
          if (drag.current == null) return;
          const p = point(event);
          if (p == null) return;
          const { id, start, origin } = drag.current;
          if (Math.hypot(p.x - start.x, p.y - start.y) > 3)
            drag.current.moved = true;
          if (!drag.current.moved) return;
          setPositions((previous) =>
            new Map(previous).set(id, {
              x: origin.x + p.x - start.x,
              y: origin.y + p.y - start.y,
            }),
          );
        },
        onPointerUp(event) {
          suppressClick.current = drag.current?.moved ?? false;
          drag.current = null;
          const target = event.target as Element;
          if (target.hasPointerCapture?.(event.pointerId))
            target.releasePointerCapture(event.pointerId);
        },
        onPointerCancel() {
          drag.current = null;
          suppressClick.current = false;
        },
      },
      [
        h(
          "defs",
          h(
            "marker",
            {
              id: arrowId,
              viewBox: "0 0 10 10",
              refX: 9,
              refY: 5,
              markerWidth: 7,
              markerHeight: 7,
              orient: "auto-start-reverse",
              markerUnits: "strokeWidth",
            },
            h("path.kg-arrow", { d: "M 0 0 L 10 5 L 0 10 z" }),
          ),
        ),
        ...relationships.map((edge) => {
          const geometry = edgeGeometry(edge, relationships, actual);
          if (!geometry) return null;
          return h(
            "g.kg-edge",
            {
              key: edge.id,
              className: classNames({ active: edge.id === selectedId }),
              role: "button",
              tabIndex: 0,
              "aria-label": `${edge.relationship_type ?? "Unspecified relationship"}: ${nodes.find((node) => node.id === edge.source)?.name} to ${nodes.find((node) => node.id === edge.dest)?.name}`,
              onClick(event) {
                event.stopPropagation();
                selectEdge(edge);
              },
              onKeyDown(event) {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectEdge(edge);
                }
              },
            },
            [
              h("path.kg-edge-hit", { d: geometry.path }),
              h("path.kg-edge-line", {
                d: geometry.path,
                markerEnd: `url(#${arrowId})`,
              }),
              h(
                "text.kg-edge-label",
                { x: geometry.label.x, y: geometry.label.y },
                edge.relationship_type ?? "Unspecified",
              ),
            ],
          );
        }),
        ...nodes.map((node) => {
          const p = actual.get(node.id)!;
          const active = selectedNodes.includes(node.id);
          let name = node.name;
          if (name.length > 21) name = `${name.slice(0, 20)}…`;
          return h(
            "g.kg-node",
            {
              key: node.id,
              transform: `translate(${p.x}, ${p.y})`,
              className: classNames({
                active,
                matched: node.match != null,
                dimmed: !highlightedIDs.has(node.id),
              }),
              role: "button",
              tabIndex: 0,
              "aria-label": `${node.name}, ${node.type?.name ?? "entity"}`,
              "aria-pressed": active,
              onPointerDown(event) {
                if (event.button !== 0) return;
                const start = point(event);
                if (start == null) return;
                event.stopPropagation();
                suppressClick.current = false;
                drag.current = { id: node.id, start, origin: p, moved: false };
                event.currentTarget.setPointerCapture(event.pointerId);
              },
              onClick(event) {
                event.stopPropagation();
                if (!suppressClick.current) selectNode(node.id, event);
                suppressClick.current = false;
              },
              onKeyDown(event) {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectNode(node.id, event);
                }
              },
            },
            [
              h("title", `${node.name} (${node.type?.name ?? "entity"})`),
              h("rect.kg-node-box", {
                x: -NODE_WIDTH / 2,
                y: -NODE_HEIGHT / 2,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                rx: 8,
              }),
              h("circle", {
                cx: -63,
                cy: 0,
                r: 5,
                fill: node.type?.color ?? "#888",
              }),
              h("text.kg-node-name", { x: 5, y: -3 }, name),
              h(
                "text.kg-node-type",
                { x: 5, y: 14 },
                node.type?.name ?? "entity",
              ),
            ],
          );
        }),
        h.if(nodes.length === 0)(
          "text.kg-empty",
          { x: baseWidth / 2, y: baseHeight / 2 },
          "Tag entities in the paragraph to begin.",
        ),
      ],
    ),
  ]);
}
