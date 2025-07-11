import { TreeData } from "./types";
import { treeToGraph } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import {
  forceSimulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
  forceCenter,
  forceLink,
  forceManyBody,
  forceCollide,
} from "d3-force";
import { useEffect, useState } from "react";
import { Spinner, Switch } from "@blueprintjs/core";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { getTagStyle } from "../extractions";

const h = hyper.styled(styles);

export function GraphView(props: {
  tree: TreeData[];
  width: number;
  height: number;
  dispatch: (action: any) => void;
  selectedNodes: number[];
}) {
  // A graph view with react-flow
  // Get positions of nodes using force simulation
  const { tree, width, height, dispatch, selectedNodes } = props;

  const [nodes, setNodes] = useState<SimulationNodeDatum[]>(null);
  const [links, setLinks] = useState<SimulationLinkDatum[]>(null);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    const { nodes, edges } = treeToGraph(tree);

    const nodesMap = new Map<number, SimulationNodeDatum>(
      nodes.map((d) => [d.id, d]),
    );

    const links = edges.map((d) => {
      return {
        source: nodesMap.get(d.source),
        target: nodesMap.get(d.dest),
        strength: 1,
      };
    });

    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links))
      .force("charge", forceManyBody().strength(-50))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(20))
      .on("tick", () => {
        // Update the positions of the nodes
        // setNodes(nodes);
        console.log("Simulation tick");
      })
      .on("end", () => {
        // Update the positions of the nodes
        setNodes(nodes);
        setLinks(links);
      });

    return () => {
      simulation.stop();
    };
  }, [tree, width, height]);

  if (nodes == null || links == null) {
    return h(Spinner);
  }

  console.log("Graph", nodes, links, selectedNodes);

  return h(
    ErrorBoundary,
    {
      description: "An error occurred while rendering the graph view.",
    },
    h("div.graph-view", { style: { width, height } }, [
      h(Switch, {
        className: "show-labels-switch",
        label: "Show Labels",
        checked: showLabels,
        onChange: (e) => setShowLabels(e.target.checked),
      }),
      h("svg", { width, height }, [
        h(
          "g.links",
          links.map((d) => {
            return h("line", {
              x1: d.source.x,
              y1: d.source.y,
              x2: d.target.x,
              y2: d.target.y,
              stroke: "black",
            });
          }),
        ),
        h(
          "g.nodes",
          nodes.map((d) => {
            const active = selectedNodes.includes(d.id);
            const stroke = active ? "white" : "black";
            const highlighted = isHighlighted(d.id, selectedNodes, nodes);
            const style = getTagStyle(d.color, { highlighted, active });

            return h("g", [
              h("circle", {
                cx: d.x,
                cy: d.y,
                r: 8,
                fill: style.backgroundColor || "blue",
                onClick: (e) => {
                  e.stopPropagation();
                  if (
                    e.ctrlKey ||
                    e.metaKey ||
                    (selectedNodes[0] === d.id && selectedNodes.length === 1)
                  ) {
                    // Toggle selection on ctrl/cmd click or when node is only selected node
                    e.stopPropagation();
                    dispatch({
                      type: "toggle-node-selected",
                      payload: { ids: [d.id] },
                    });
                  } else {
                    dispatch({
                      type: "select-node",
                      payload: { ids: [d.id] },
                    });
                  }
                },
                className: active ? "selected" : "",
                stroke,
                strokeWidth: 2,
              }),
              h.if(showLabels)(
                "text",
                {
                  x: d.x + 10,
                  y: d.y + 4,
                  className: "node-label",
                },
                d.name || `Node ${d.id}`,
              ),
              h.if(!showLabels)("title", d.name || `Node ${d.id}`),
            ]);
          }),
        ),
      ]),
    ]),
  );
}

function isHighlighted(id: number, selectedNodes: number[], nodes: TreeData[]) {
  if (selectedNodes.length === 0) return true;
  return (
    selectedNodes.includes(id) ||
    nodes.some(
      (node) =>
        selectedNodes.includes(node.id) &&
        node.children.some((child) => child.id === id),
    )
  );
}
