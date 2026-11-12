import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildHighlights, type MatchComponent } from "../extractions";
import type { TreeData } from "./types";
import type { TreeDispatch } from "./edit-state";
import {
  type Relationship,
  type RelationshipID,
  uniqueEntities,
  visibleConnections,
} from "./relationships";
import {
  edgeGeometry,
  initialPositions,
  fitCamera,
  zoomCamera,
  panCamera,
  type Camera,
  NODE_HEIGHT,
  NODE_WIDTH,
  type Point,
} from "./kg-layout";
import styles from "./kg-editor.module.sass";

const h = hyper.styled(styles);

interface KGEditorProps {
  tree: TreeData[];
  relationships: Relationship[];
  selectedNodes: number[];
  selectedRelationship: RelationshipID | null;
  connectionMode: boolean;
  connectionSource: number | null;
  movingEndpoint: "source" | "dest" | null;
  connectionNotice: string | null;
  dispatch: TreeDispatch;
  viewOnly: boolean;
  matchComponent?: MatchComponent;
  matchLinks?: Record<string, string>;
  resetKey: unknown;
}

/** Click entities to connect them; select an arrow to reconnect or delete it. */
export function KGEditor({
  tree,
  relationships,
  selectedNodes,
  selectedRelationship,
  connectionMode,
  connectionSource,
  movingEndpoint,
  connectionNotice,
  dispatch,
  viewOnly,
  resetKey,
}: KGEditorProps) {
  const nodes = useMemo(() => uniqueEntities(tree), [tree]);
  const connections = useMemo(
    () => visibleConnections(nodes, relationships),
    [nodes, relationships],
  );
  const highlights = useMemo(() => buildHighlights(tree, null), [tree]);
  const selectedConnection = connections.find(
    (edge) => edge.id === selectedRelationship,
  );
  const picking = !viewOnly && (connectionMode || movingEndpoint != null);
  const entityName = (id: number) =>
    nodes.find((node) => node.id === id)?.name ?? "entity";
  let instruction = "Click the source entity, then the destination.";
  if (connectionSource != null)
    instruction = `From ${entityName(connectionSource)} → click the destination.`;
  if (movingEndpoint === "source") instruction = "Click the new source entity.";
  if (movingEndpoint === "dest")
    instruction = "Click the new destination entity.";

  function clearSelection() {
    dispatch({ type: "deselect" });
  }

  function deleteConnection(edge: Relationship) {
    if (viewOnly || !edge) return;
    dispatch({ type: "delete-relationship", payload: { id: edge.id } });
  }

  // Use the same entity/parent emphasis as the paragraph.
  const highlightedIDs = new Set(
    highlights
      .filter(
        (tag) =>
          picking ||
          selectedNodes.length === 0 ||
          selectedNodes.includes(tag.id) ||
          tag.parents?.some((id) => selectedNodes.includes(id)),
      )
      .map((tag) => tag.id),
  );

  function selectNode(
    id: number,
    event: React.MouseEvent | React.KeyboardEvent,
  ) {
    if (viewOnly) return;
    if (picking) {
      dispatch({ type: "pick-connection-node", payload: { id } });
      return;
    }
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

  return h(
    "section.kg-editor",
    {
      "aria-label": "Knowledge graph editor",
      onKeyDown(event) {
        if (event.key === "Escape") {
          event.stopPropagation();
          clearSelection();
        }
      },
    },
    [
      h("div.kg-toolbar", [
        h("strong", "Knowledge graph"),
        h(
          "span.kg-count",
          `${nodes.length} entities · ${connections.length} connections`,
        ),
        h.if(!viewOnly)(
          Button,
          {
            icon: "link",
            small: true,
            active: connectionMode,
            "aria-pressed": connectionMode,
            disabled: nodes.length < 2,
            onClick() {
              dispatch({
                type: "set-connection-mode",
                payload: !connectionMode,
              });
            },
          },
          "Relationship mode",
        ),
      ]),
      h.if(picking)("div.kg-connection-status", [
        h("span", { role: "status", "aria-live": "polite" }, [
          h.if(connectionNotice != null)("strong", connectionNotice + " "),
          instruction,
        ]),
        h(
          Button,
          { small: true, minimal: true, onClick: clearSelection },
          "Cancel",
        ),
      ]),
      h.if(!viewOnly && selectedConnection != null)(
        "div.kg-connection-actions",
        {
          role: "group",
          "aria-label": "Selected connection",
        },
        [
          h(
            "strong.kg-connection-label",
            `${entityName(selectedConnection?.source)} → ${entityName(selectedConnection?.dest)}`,
          ),
          h(
            Button,
            {
              small: true,
              active: movingEndpoint === "source",
              onClick() {
                dispatch({
                  type: "start-relationship-move",
                  payload: { id: selectedConnection.id, endpoint: "source" },
                });
              },
            },
            "Change source",
          ),
          h(
            Button,
            {
              small: true,
              active: movingEndpoint === "dest",
              onClick() {
                dispatch({
                  type: "start-relationship-move",
                  payload: { id: selectedConnection.id, endpoint: "dest" },
                });
              },
            },
            "Change destination",
          ),
          h(
            Button,
            {
              small: true,
              icon: "trash",
              intent: "danger",
              onClick: () => deleteConnection(selectedConnection),
            },
            "Delete connection",
          ),
          h(
            Button,
            { small: true, minimal: true, onClick: clearSelection },
            "Close",
          ),
        ],
      ),
      h("div.kg-body", [
        h(GraphCanvas, {
          nodes,
          relationships: connections,
          selectedNodes,
          selectedRelationship,
          connectionSource,
          picking,
          viewOnly,
          highlightedIDs,
          selectNode,
          selectConnection(edge: Relationship) {
            if (viewOnly) return;
            dispatch({ type: "select-relationship", payload: { id: edge.id } });
          },
          deleteConnection,
          resetKey,
          onClear: clearSelection,
          onDelete() {
            if (viewOnly) return;
            if (selectedConnection) deleteConnection(selectedConnection);
            else if (picking) clearSelection();
            else
              dispatch({
                type: "delete-node",
                payload: { ids: selectedNodes },
              });
          },
        }),
      ]),
    ],
  );
}

function GraphCanvas({
  nodes,
  relationships,
  selectedNodes,
  selectedRelationship,
  connectionSource,
  picking,
  viewOnly,
  highlightedIDs,
  selectNode,
  selectConnection,
  deleteConnection,
  resetKey,
  onClear,
  onDelete,
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowId = `kg-arrow-${useId().replace(/:/g, "")}`;
  const [positions, setPositions] = useState<Map<number, Point>>(new Map());
  const [viewport, setViewport] = useState({ width: 800, height: 400 });
  const viewportRef = useRef(viewport);
  const [arrangement, setArrangement] = useState(0);
  const topology = JSON.stringify(nodes.map((node) => node.id));
  // Use current connections when arranging or changing entities. Editing
  // connections must keep node positions and the camera stable for rapid clicks.
  const defaults = useMemo(
    () =>
      initialPositions(
        nodes.map((node) => node.id),
        relationships,
        viewportRef.current.width / viewportRef.current.height,
      ),
    [topology, resetKey, arrangement],
  );
  const actual = new Map<number, Point>(
    nodes.map((node) => [
      node.id,
      positions.get(node.id) ?? defaults.get(node.id)!,
    ]),
  );
  const actualRef = useRef(actual);
  actualRef.current = actual;
  const [camera, setCamera] = useState<Camera>(() =>
    fitCamera(defaults.values(), 800, 400),
  );
  const cameraRef = useRef(camera);
  const autoFit = useRef(true);
  const [panning, setPanning] = useState(false);
  const drag = useRef<{
    kind: "node" | "pan";
    id?: number;
    pointerId: number;
    capture: Element;
    start: Point;
    origin: Point;
    camera: Camera;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  function updateCamera(next: Camera) {
    cameraRef.current = next;
    setCamera(next);
  }

  useEffect(() => {
    setPositions(new Map());
    autoFit.current = true;
    const { width, height } = viewportRef.current;
    updateCamera(fitCamera(defaults.values(), width, height));
    drag.current = null;
    setPanning(false);
  }, [defaults]);

  // Keep the drawing coordinate system in CSS pixels at every panel size.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      const previous = viewportRef.current;
      viewportRef.current = { width, height };
      setViewport({ width, height });
      if (autoFit.current) {
        updateCamera(fitCamera(actualRef.current.values(), width, height));
      } else {
        const old = cameraRef.current;
        updateCamera({
          ...old,
          x: old.x + (previous.width - width) / (2 * old.scale),
          y: old.y + (previous.height - height) / (2 * old.scale),
        });
      }
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  function screenPoint(event: {
    clientX: number;
    clientY: number;
  }): Point | null {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return null;
    const size = viewportRef.current;
    return {
      x: ((event.clientX - rect.left) * size.width) / rect.width,
      y: ((event.clientY - rect.top) * size.height) / rect.height,
    };
  }

  // A non-passive listener lets wheel/trackpad gestures zoom this graph,
  // instead of scrolling the page while the pointer is over the canvas.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (drag.current) return;
      const anchor = screenPoint(event);
      if (!anchor) return;
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= viewportRef.current.height;
      autoFit.current = false;
      updateCamera(
        zoomCamera(
          cameraRef.current,
          Math.exp(-Math.max(-120, Math.min(120, delta)) * 0.002),
          anchor,
        ),
      );
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  function zoom(factor: number) {
    if (drag.current) return;
    autoFit.current = false;
    const { width, height } = viewportRef.current;
    updateCamera(
      zoomCamera(cameraRef.current, factor, { x: width / 2, y: height / 2 }),
    );
  }

  function fit(selected = false) {
    const points = [...actual]
      .filter(([id]) => !selected || selectedNodes.includes(id))
      .map(([, point]) => point);
    const { width, height } = viewportRef.current;
    autoFit.current = !selected;
    updateCamera(fitCamera(points, width, height, selected ? 2 : 1));
  }

  function startDrag(event, kind: "node" | "pan", id?: number) {
    if (drag.current || !event.isPrimary) return;
    const start = screenPoint(event);
    if (!start) return;
    event.preventDefault();
    event.stopPropagation();
    svgRef.current?.focus({ preventScroll: true });
    const capture = event.currentTarget as Element;
    const current = cameraRef.current;
    let origin: Point = current;
    if (kind === "node") origin = actual.get(id)!;
    drag.current = {
      kind,
      id,
      start,
      origin,
      camera: current,
      pointerId: event.pointerId,
      capture,
      moved: false,
    };
    suppressClick.current = false;
    capture.setPointerCapture(event.pointerId);
    if (kind === "pan") setPanning(true);
  }

  function finishDrag(event, cancelled = false) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    suppressClick.current = cancelled || current.moved;
    drag.current = null;
    setPanning(false);
    if (current.capture.hasPointerCapture(event.pointerId))
      current.capture.releasePointerCapture(event.pointerId);
  }

  return h("div.kg-canvas", [
    h("div.kg-canvas-controls", [
      h(ButtonGroup, { small: true }, [
        h(Button, {
          icon: "zoom-in",
          "aria-label": "Zoom in",
          onClick: () => zoom(1.2),
        }),
        h(Button, {
          icon: "zoom-out",
          "aria-label": "Zoom out",
          onClick: () => zoom(1 / 1.2),
        }),
        h(Button, { icon: "zoom-to-fit", onClick: () => fit() }, "Fit all"),
        h(
          Button,
          {
            icon: "locate",
            disabled: selectedNodes.length === 0,
            onClick: () => fit(true),
          },
          "Focus selected",
        ),
        h(
          Button,
          {
            icon: "layout",
            onClick() {
              setArrangement((value) => value + 1);
            },
          },
          "Arrange",
        ),
      ]),
      h(
        "span.kg-help",
        "Drag background to pan · Scroll to zoom at pointer · Ctrl/⌘-click to select more",
      ),
      h.if(!viewOnly)(
        "span.kg-help",
        "Click a connection to move or delete it.",
      ),
    ]),
    h(
      "svg.kg-svg",
      {
        ref: svgRef,
        viewBox: `${camera.x} ${camera.y} ${viewport.width / camera.scale} ${viewport.height / camera.scale}`,
        preserveAspectRatio: "none",
        className: classNames({ panning, picking }),
        tabIndex: 0,
        role: "group",
        "aria-label": "Directed knowledge graph",
        onPointerDown(event) {
          if (
            event.button === 1 ||
            (event.button === 0 && event.target === event.currentTarget)
          )
            startDrag(event, "pan");
        },
        onClick(event) {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (event.target === event.currentTarget) onClear();
        },
        onKeyDown(event) {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClear();
          }
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            onDelete();
          }
          if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            zoom(1.2);
          }
          if (event.key === "-") {
            event.preventDefault();
            zoom(1 / 1.2);
          }
        },
        onPointerMove(event) {
          const current = drag.current;
          if (!current || current.pointerId !== event.pointerId) return;
          const point = screenPoint(event);
          if (!point) return;
          const delta = {
            x: point.x - current.start.x,
            y: point.y - current.start.y,
          };
          if (Math.hypot(delta.x, delta.y) > 3) current.moved = true;
          if (!current.moved) return;
          autoFit.current = false;
          if (current.kind === "pan")
            updateCamera(panCamera(current.camera, delta));
          else
            setPositions((previous) =>
              new Map(previous).set(current.id!, {
                x: current.origin.x + delta.x / current.camera.scale,
                y: current.origin.y + delta.y / current.camera.scale,
              }),
            );
        },
        onPointerUp: (event) => finishDrag(event),
        onPointerCancel: (event) => finishDrag(event, true),
        onLostPointerCapture: (event) => finishDrag(event, true),
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
          const active = edge.id === selectedRelationship;
          const source = nodes.find((node) => node.id === edge.source)?.name;
          const dest = nodes.find((node) => node.id === edge.dest)?.name;
          return h(
            "g.kg-edge",
            {
              key: edge.id,
              className: classNames({ active, editable: !viewOnly }),
              role: viewOnly ? "img" : "button",
              tabIndex: viewOnly ? undefined : 0,
              "aria-label": `${source} → ${dest}`,
              "aria-pressed": viewOnly ? undefined : active,
              onPointerDown(event) {
                if (viewOnly || event.button !== 0) return;
                event.stopPropagation();
                suppressClick.current = false;
                (event.currentTarget as SVGElement).focus({
                  preventScroll: true,
                });
              },
              onClick(event) {
                event.stopPropagation();
                if (!suppressClick.current) selectConnection(edge);
                suppressClick.current = false;
              },
              onKeyDown(event) {
                if (event.key === "Delete" || event.key === "Backspace") {
                  event.preventDefault();
                  event.stopPropagation();
                  deleteConnection(edge);
                  return;
                }
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                selectConnection(edge);
              },
            },
            [
              h("title", `${source} → ${dest}`),
              h("path.kg-edge-hit", {
                d: geometry.path,
                vectorEffect: "non-scaling-stroke",
              }),
              h("path.kg-edge-line", {
                d: geometry.path,
                markerEnd: `url(#${arrowId})`,
                "aria-hidden": true,
              }),
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
                "connection-source": picking && node.id === connectionSource,
                matched: node.match != null,
                dimmed: !highlightedIDs.has(node.id),
              }),
              role: "button",
              tabIndex: 0,
              "aria-label": `${node.name}, ${node.type?.name ?? "entity"}`,
              "aria-pressed":
                active || (picking && node.id === connectionSource),
              onPointerDown(event) {
                if (picking && event.button === 0) {
                  event.stopPropagation();
                  suppressClick.current = false;
                  (event.currentTarget as SVGElement).focus({
                    preventScroll: true,
                  });
                  return;
                }
                if (event.button === 0) startDrag(event, "node", node.id);
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
          { x: 0, y: 0 },
          "Tag entities in the paragraph to begin.",
        ),
      ],
    ),
  ]);
}
