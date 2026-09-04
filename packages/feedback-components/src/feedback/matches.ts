import { Select } from "@blueprintjs/select";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { useState, useEffect } from "react";
import { Icon, Divider, Overlay2 } from "@blueprintjs/core";
import { JSONView, SaveButton } from "@macrostrat/ui-components";
import { useAPIResult, DataField } from "@macrostrat/ui-components";
import { Tag } from "@macrostrat/data-components";
import { useFeedbackConfig } from "./config";

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

  return h("div", [
    h(Divider),
    h.if(nodeMatch?.match)(Match, {
      data: nodeMatch?.match,
      matchLinks: matchLinks,
      dispatch,
      nodeId: nodeMatch?.id,
    }),
    h.if(selectedNodes.length != 1 || !nodeMatch?.match)(
      "div.add-match-container",
      [
        h.if(selectedNodes.length == 1 && !nodeMatch?.match)(
          "div.add-type",
          {
            onClick: () => {
              setOverlayOpen(true);
            },
          },
          [h("p.add-match-text", "Add match"), h(Icon, { icon: "plus" })],
        ),
        h.if(selectedNodes.length != 1)(
          "div.add-type",
          [h("p.add-match-text", "No entity selected")],
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
  const [data, setData] = useState([]);
  const { termsEndpoint } = useFeedbackConfig();

  useEffect(() => {
    if (!inputValue || inputValue.length < 3) return;
    if (termsEndpoint == null) return;
    let cancelled = false;
    const url = new URL(termsEndpoint);
    url.searchParams.set("name", `ilike.*${inputValue}*`);
    url.searchParams.set("limit", "50");
    fetch(url.toString())
      .then((res) => res.json())
      .then((res) => {
        if (cancelled || !Array.isArray(res)) return;
        setData(res);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, [inputValue, termsEndpoint]);

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
          "Add match ",
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
              popoverProps: { minimal: true, usePortal: false },
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

export function MatchTag({ data, matchLinks, setPayload }: MatchTagProps) {
  if (data == undefined || Object.keys(data).length === 0) return;

  const { entity_id, entity_type, macrostrat_terms_id, name } = data

  const newPayload = {
    entity_id,
    entity_type,
    macrostrat_terms_id,
    name,
  }

  return h(
      "div",
      {
        onClick: () => setPayload(newPayload)
      },
      h(DataField, {
        className: "match-item",
        label: entity_type?.replace(/^./, (c) => c.toUpperCase()),
        value: h(Tag, {
          name: data.name,
          href: getMatchUrl(data, matchLinks),
          target: "_blank",
        }),
      }),
    );
}

function getMatchUrl(match: any, matchLinks?: Record<string, string>) {
  if (!match || !matchLinks) return undefined;

  const entityType = match?.entity_type;

  const url = matchLinks?.[entityType];

  if (url) {
    return `${url}/${getMatchId(match)}`;
  } 

  return undefined
}

function getMatchId(match: any) {
  return (
    match?.entity_id ??
    match?.macrostrat_terms_id ??
    match?.strat_name_id ??
    match?.lith_id ??
    match?.concept_id ??
    match?.lith_att_id ??
    match?.interval_id ??
    null
  );
}
