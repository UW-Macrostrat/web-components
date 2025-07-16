import { Switch } from "@blueprintjs/core";
import { Match } from "./text-visualizer";
import { Select } from "@blueprintjs/select";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { Icon, Divider, Overlay2 } from "@blueprintjs/core";
import { JSONView, SaveButton } from "@macrostrat/ui-components";
import { useAPIResult, DataField } from "@macrostrat/ui-components";
import { LithologyTag } from "@macrostrat/data-components";

const h = hyper.styled(styles);

export function Matches({
  match,
  setMatchLinks,
  matchLinks,
  selectedNodes,
  tree,
  dispatch,
}) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  let nodeMatch = null;
  if (selectedNodes.length === 1) {
    nodeMatch = findMatchingNode(tree, selectedNodes[0]);
  }

  return h.if(matchLinks)("div", [
    h(Divider),
    h(Switch, {
      label: "Show matches",
      checked: match !== null,
      onChange: (e) => {
        setMatchLinks(match === null ? matchLinks || {} : null);
      },
    }),
    h.if(nodeMatch && match)(Match, {
      data: nodeMatch?.match,
      matchLinks: matchLinks,
      dispatch,
      nodeId: nodeMatch?.id,
    }),
    h.if(selectedNodes.length == 1 && !nodeMatch?.match && match)(
      "div.add-match-container",
      [
        h(
          "div.add-type",
          {
            onClick: () => {
              setOverlayOpen(true);
            },
          },
          [h("p.add-match-text", "Add match"), h(Icon, { icon: "plus" })],
        ),
        h(MatchOverlay, {
          isOpen: overlayOpen,
          setOverlayOpen,
          nodeMatch,
          dispatch,
        }),
      ],
    ),
  ]);
}

function findMatchingNode(tree, nodeId) {
  let match = null;

  function traverse(node) {
    if (node.id === nodeId) {
      match = node;
      return true;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (traverse(child)) return true;
      }
    }
    return false;
  }

  tree.forEach(traverse);
  return match;
}

function MatchOverlay({ isOpen, setOverlayOpen, nodeMatch, dispatch }) {
  const [inputValue, setInputValue] = useState(nodeMatch?.name || "");
  const [selectedItem, setSelectedItem] = useState(h("div", "Select a match"));
  const [disabled, setDisabled] = useState(true);
  const [payload, setPayload] = useState({});

  const data = useAPIResult(
    "https://dev.macrostrat.org/api/pg/type_lookup?name=ilike.*" +
      inputValue +
      "*",
  );
  const items = data?.map((data) => {
    const type = data.type || "";

    if (type === "lith") {
      return h(
        "div",
        {
          onClick: () => {
            setPayload({ lith_id: data.id, name: data.name });
          },
        },
        h(DataField, {
          className: "match-item",
          label: "Lithology",
          value: h(LithologyTag, {
            data: { name: data.name, id: data.lith_id, color: data.color },
          }),
        }),
      );
    }

    if (type === "strat_name") {
      return h(
        "div",
        {
          onClick: () => {
            setPayload({ strat_name_id: data.id, name: data.name });
          },
        },
        h(DataField, {
          className: "match-item",
          label: "Stratigraphic name",
          value: h(LithologyTag, {
            data: { name: data.name, id: data.id, color: data.color },
          }),
        }),
      );
    }

    if (type === "lith_att") {
      return h(
        "div",
        {
          onClick: () => {
            setPayload({ lith_att_id: data.lith_att_id, name: data.name });
          },
        },
        h(DataField, {
          className: "match-item",
          label: "Lithology attribute",
          value: h(LithologyTag, {
            data: { name: data.name, id: data.lith_att_id },
          }),
          onClick: () => {
            setPayload({ lith_att_id: data.lith_att_id, name: data.name });
          },
        }),
      );
    }

    if (type === "interval") {
      h(
        "div",
        {
          onClick: () => {
            setPayload({ int_id: data.id, name: data.name });
          },
        },
        h(DataField, {
          label: "Interval",
          className: "match-item",
          value: h(LithologyTag, {
            data: { name: data.name, id: data.id },
          }),
          onClick: () => {
            setPayload({ int_id: data.id, name: data.name });
          },
        }),
      );
    }

    return h(JSONView, { data });
  });

  return h(
    Overlay2,
    {
      isOpen,
    },
    h(
      "div.overlay-container",
      h("div.add-type-overlay", [
        h("h2.title", [
          "Add match with " + nodeMatch.name,
          h(Icon, {
            icon: "cross",
            className: "close-icon",
            onClick: () => {
              setOverlayOpen(false);
            },
            style: { cursor: "pointer", color: "red" },
          }),
        ]),
        h("div.form-group", [
          h(
            Select,
            {
              items: items || [],
              itemRenderer: (item, { handleClick }) => {
                return h("div.match-item", { onClick: handleClick }, item);
              },
              onItemSelect: (item) => {
                setDisabled(false);
                setSelectedItem(item);
              },
              onQueryChange: (query) => setInputValue(query),
              popoverProps: { minimal: true },
              query: inputValue,
              placeholder: "Enter match name",
            },
            selectedItem,
          ),
        ]),
        h(
          SaveButton,
          {
            className: "save-btn",
            small: true,
            onClick: () => {
              // Handle save changes
              dispatch({
                type: "add-match",
                payload: { id: nodeMatch.id, payload },
              });
              setOverlayOpen(false);
            },
            disabled,
          },
          "Save changes",
        ),
      ]),
    ),
  );
}
