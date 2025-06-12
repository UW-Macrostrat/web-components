import { TreeData } from "./types";
import { treeToGraph } from "./edit-state";
import h from "@macrostrat/hyper";

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
import { Spinner, Popover } from "@blueprintjs/core";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { getTagStyle } from "../extractions";

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

  useEffect(() => {
    const { nodes, edges } = treeToGraph(tree);

    const nodesMap = new Map<number, SimulationNodeDatum>(
      nodes.map((d) => [d.id, d])
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

  return h(ErrorBoundary, 
    {
      description: "An error occurred while rendering the graph view."
    },
    h("div.graph-view", { style: { width, height } }, [
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
        })
      ),
      h(
        "g.nodes",
        nodes.map((d) => {
          const active = selectedNodes.includes(d.id);
          const stroke = active ? "white" : "black";
          const highlighted = isHighlighted(d.id, selectedNodes, nodes);
          const style = getTagStyle(d.color, { highlighted, active });

          return h("circle", {
            cx: d.x,
            cy: d.y,
            r: 5,
            fill: style.backgroundColor || "blue",
            onClick: (e) => {
              e.stopPropagation();
              dispatch({
                type: "toggle-node-selected",
                payload: { ids: [d.id] },
              });
            },
            className: active ? "selected" : "",
            stroke,
            strokeWidth: 2,
          },
          h(
            "title",
            d.name || `Node ${d.id}`
          ) 
        );
        })
      ),
    ])
  ])
  );
}

function isHighlighted(id: number, selectedNodes: number[], nodes: TreeData[]) {
  if (selectedNodes.length === 0) return true;
  return (
    selectedNodes.includes(id) ||
    nodes.some((node) => selectedNodes.includes(node.id) && node.children.some((child) => child.id === id))
  );
}
