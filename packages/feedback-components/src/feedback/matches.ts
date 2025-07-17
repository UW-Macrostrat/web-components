import { Switch } from "@blueprintjs/core";
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
      label: "Match mode",
      checked: match !== null,
      onChange: (e) => {
        setMatchLinks(match === null ? matchLinks || {} : null);
        dispatch({ type: "toggle-match-mode" });
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
  const items = data?.map((data) => h(MatchTag, { data, setPayload }));

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

function Match({ data, matchLinks, dispatch, nodeId }) {
  return h.if(data)("div.match-container", [
    MatchTag({ data, matchLinks }),
    h(Icon, {
      icon: "cross",
      color: "red",
      className: "close-btn",
      onClick: () => {
        dispatch({ type: "remove-match", payload: { id: nodeId } });
      },
    }),
  ]);
}

interface MatchTagProps {
  data: any;
  matchLinks?: Record<string, string>;
  setPayload?: (payload: Record<string, any>) => void;
}

function MatchTag({ data, matchLinks, setPayload }: MatchTagProps) {
  if (!data || Object.keys(data).length === 0) return;

  if (data.lith_id || data?.type === "lith") {
    return h(
      "div",
      {
        onClick: () => {
          data.type === "lith"
            ? setPayload({ lith_id: data.id, name: data.name })
            : null;
        },
      },
      h(DataField, {
        className: "match-item",
        label: "Stratigraphic name",
        value: h(LithologyTag, {
          data: { name: data.name, id: data.id, color: data.color },
          onClick: () =>
            window.open(
              matchLinks.strat_name + "/" + data.strat_name_id,
              "_blank",
            ),
        }),
      }),
    );
  }

  if (data.strat_name_id || data?.type === "strat_name") {
    return h(
      "div",
      {
        onClick: () => {
          data.type === "strat_name"
            ? setPayload({ strat_name_id: data.id, name: data.name })
            : null;
        },
      },
      h(DataField, {
        className: "match-item",
        label: "Stratigraphic name",
        value: h(LithologyTag, {
          data: { name: data.name, id: data.id, color: data.color },
          onClick: () =>
            window.open(
              matchLinks.strat_name + "/" + data.strat_name_id,
              "_blank",
            ),
        }),
      }),
    );
  }

  if (data.lith_att_id || data?.type === "lith_att") {
    return h(
      "div",
      {
        onClick: () => {
          data.type === "lith_att"
            ? setPayload({ lith_att_id: data.id, name: data.name })
            : null;
        },
      },
      h(DataField, {
        className: "match-item",
        label: "Lithology attribute",
        value: h(LithologyTag, {
          data: { name: data.name, id: data.lith_att_id },
          onClick: () =>
            window.open(matchLinks.lith_att + "/" + data.lith_att_id, "_blank"),
        }),
      }),
    );
  }

  if (data.int_id || data?.type === "interval") {
    return h(
      "div",
      {
        onClick: () => {
          data.type === "interval"
            ? setPayload({ int_id: data.id, name: data.name })
            : null;
        },
      },
      h(DataField, {
        label: "Interval",
        className: "match-item",
        value: h(LithologyTag, {
          data: { name: data.name, id: data.id },
          onClick: () =>
            window.open(matchLinks.interval + "/" + data.int_id, "_blank"),
        }),
      }),
    );
  }

  return h(JSONView, { data });
}
