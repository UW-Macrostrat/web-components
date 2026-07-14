import { AnnotateBlendTag } from "react-text-annotate-blend";
import { InternalEntity } from "./types";
import { TreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { buildHighlights, getTagStyle } from "../extractions";
import { Highlight } from "../extractions/types";
import { useEffect, useRef } from "react";
import { Popover } from "@blueprintjs/core";
import { MatchTag } from "./matches";

const h = hyper.styled(styles);

export interface FeedbackTextProps {
  text: string;
  selectedNodes: number[];
  nodes: InternalEntity[];
  updateNodes: (nodes: string[]) => void;
  dispatch: TreeDispatch;
  lineHeight: string;
  allowOverlap?: boolean;
  matchLinks?: Record<string, string>;
  viewOnly?: boolean;
}

function buildTags(
  highlights: Highlight[],
  selectedNodes: number[],
): AnnotateBlendTag[] {
  let tags: AnnotateBlendTag[] = [];
  // If entity ID has already been seen, don't add it again
  const entities = new Set<number>();

  for (const highlight of highlights) {
    // Don't add multiply-linked entities multiple times
    if (entities.has(highlight.id)) continue;

    const highlighted = isHighlighted(highlight, selectedNodes);
    const active = isActive(highlight, selectedNodes);
    const tagStyle = getTagStyle(highlight.backgroundColor, {
      highlighted,
      active,
    });

    const tag = {
      color: tagStyle.color,
      tagStyle: {
        display: "none",
      },
      markStyle: {
        backgroundColor: tagStyle.backgroundColor,
      },
      ...highlight,
      backgroundColor: tagStyle.backgroundColor,
    };

    tags.push(tag);

    entities.add(highlight.id);
  }

  return tags;
}

function isActive(tag: Highlight, selectedNodes: number[]) {
  return selectedNodes.includes(tag.id);
}

function isHighlighted(tag: Highlight, selectedNodes: number[]) {
  if (selectedNodes.length === 0) return true;
  return (
    (selectedNodes.includes(tag.id) ||
      tag.parents?.some((d) => selectedNodes.includes(d))) ??
    false
  );
}

export function FeedbackText(props: FeedbackTextProps) {
  // Convert input to tags
  const {
    text,
    selectedNodes,
    nodes,
    dispatch,
    allowOverlap,
    matchLinks,
    viewOnly,
  } = props;
  const allTags: AnnotateBlendTag[] = buildTags(
    buildHighlights(nodes, null),
    selectedNodes,
  );

  return h(
    "div.feedback-text-wrapper",
    {
      tabIndex: 0,
      onKeyDown: (e) => {
        if (e.key === "Backspace") {
          dispatch({
            type: "delete-node",
            payload: { ids: selectedNodes },
          });
        }
      },
    },
    h(HighlightedText, {
      text,
      allTags,
      allowOverlap,
      dispatch,
      selectedNodes,
      viewOnly,
      matchLinks,
    }),
  );
}

function createTagFromSelection({
  container,
}: {
  container: HTMLElement | null;
}) {
  const selection = window.getSelection();
  if (
    !selection ||
    selection.isCollapsed ||
    selection.rangeCount === 0 ||
    !container
  )
    return null;

  const range = selection.getRangeAt(0);

  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
    return null;
  }

  const preRange = document.createRange();
  preRange.setStart(container, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;

  const selectedText = range.toString();
  const end = start + selectedText.length;

  return {
    start,
    end,
    text: selectedText,
  };
}

function addTag({ tag, dispatch, text, allTags, allowOverlap }) {
  let { start, end } = tag;
  // snap to text
  if (text[end - 1] != " ") {
    // double clicking word overselects by one, shouldn't increase to next word
    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }
  }

  let payload = { start, end, text: text.slice(start, end) };

  if (payload.text.trim() === "") {
    console.log("Blank tag found, ignoring");
    return;
  }

  const duplicate = allTags.find(
    (t) =>
      t.start === payload.start &&
      (t.end === payload.end || t.end === payload.end - 1),
  );

  if (duplicate) {
    console.log("Duplicate tag found, ignoring");
    return;
  }

  if (payload.text.endsWith(" ")) {
    payload.text = payload.text.slice(0, -1);
    payload.end -= 1;
  }

  const inside = allTags.some(
    (t) => t.start <= payload.start && t.end >= payload.end,
  );

  const overlap = allTags.some(
    (t) => t.start < payload.end && t.end > payload.start,
  );

  if ((inside || overlap) && !allowOverlap) {
    console.log("Tag is inside another tag, ignoring");
    return;
  }

  dispatch({ type: "create-node", payload });
}

function nestHighlights(text: string, tags: AnnotateBlendTag[]) {
  const events: Array<{
    pos: number;
    type: "start" | "end";
    tag: AnnotateBlendTag;
  }> = [];

  for (const tag of tags) {
    events.push({ pos: tag.start, type: "start", tag });
    events.push({ pos: tag.end, type: "end", tag });
  }

  events.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    if (a.type === "end" && b.type === "start") return -1;
    if (a.type === "start" && b.type === "end") return 1;
    return 0;
  });

  const root = { children: [], textStart: 0 };
  const stack = [root];
  let lastPos = 0;

  for (const { pos, type, tag } of events) {
    const parent = stack[stack.length - 1];

    if (pos > lastPos) {
      const slice = text.slice(lastPos, pos);
      parent.children.push(slice);
    }

    if (type === "start") {
      const newNode = { tag, children: [], textStart: pos };
      parent.children.push(newNode);
      stack.push(newNode);
    } else {
      stack.pop();
    }

    lastPos = pos;
  }

  if (lastPos < text.length) {
    stack[stack.length - 1].children.push(text.slice(lastPos));
  }

  return root;
}

function renderNode(
  node: any,
  dispatch: TreeDispatch,
  selectedNodes: number[],
  parentSelected: boolean,
  matchLinks?: {
    lithology: string;
    strat_name: string;
    lith_att: string;
  },
  viewOnly?: boolean,
): any {
  if (typeof node === "string") return node;

  const { tag, children } = node;
  const isSelected = selectedNodes?.includes(tag.id);
  const showBorder = selectedNodes.length === 0 || isSelected;
  const match = tag.match;

  const style = {
    ...tag,
    zIndex: parentSelected ? -1 : 1,
    border:
      "1px solid " +
      (match != undefined && matchLinks
        ? "orange"
        : showBorder
          ? tag.color
          : "transparent"),
    margin: "-1px",
  };

  let moveText = [];
  if (isSelected) {
    for (const key in children) {
      if (Object.prototype.hasOwnProperty.call(children, key)) {
        const child = children[key];
        if (child?.tag) {
          moveText.push(child.children[0]);
        } else {
          moveText.push(child);
        }
      }
    }
  }

  const url = viewOnly && match
    ? getMatchUrl(match, matchLinks, tag.type?.name ?? tag.term_type)
    : undefined;

  const tagComponent = h(
    url ? "a.highlight-link" : "span",
    {
      onMouseEnter: (e: MouseEvent) => {
        e.stopPropagation();
      },
      className: "highlight" + (!viewOnly || match ? " clickable" : ""),
      style,
      href: url,
      target: url ? "_blank" : undefined,
      rel: url ? "noreferrer noopener" : undefined,
      onClick: url
        ? undefined
        : (e: MouseEvent) => {
            e.stopPropagation();
            if (
              e.ctrlKey ||
              e.metaKey ||
              (selectedNodes[0] === tag.id && selectedNodes.length === 1)
            ) {
              // Toggle selection on ctrl/cmd click or when node is only selected node
              e.stopPropagation();
              dispatch({
                type: "toggle-node-selected",
                payload: { ids: [tag.id] },
              });
            } else if (e.shiftKey && selectedNodes.length > 0) {
              // Select range from last selected node to this one
              const lastSelected = selectedNodes[selectedNodes.length - 1];

              dispatch({
                type: "select-range",
                payload: { ids: [lastSelected, tag.id] },
              });
            } else {
              dispatch({
                type: "select-node",
                payload: { ids: [tag.id] },
              });
            }
          },
    },
    isSelected
      ? moveText.flat()
      : children.map((child: any, i: number) =>
          renderNode(
            child,
            dispatch,
            selectedNodes,
            isSelected,
            matchLinks,
            viewOnly,
          ),
        ),
  );

  if (viewOnly && match) {
    return h(
      Popover,
      {
        content: h("div.match-link", h(MatchTag, { data: match, matchLinks })),
        interactionKind: "hover",
      },
      tagComponent,
    );
  }

  return tagComponent;
}

function getMatchUrl(
  match: any,
  matchLinks?: Record<string, string>,
  entityTypeName?: string,
) {
  if (!match || !matchLinks) return undefined;

  const prefix = getMatchPrefix(match, matchLinks, entityTypeName);
  const matchId = getMatchId(match);

  if (!prefix || matchId == null) return undefined;

  const normalized = prefix.replace(/\/$/, "");
  return `${normalized}/${matchId}`;
}

function getMatchPrefix(
  match: any,
  matchLinks?: Record<string, string>,
  entityTypeName?: string,
) {
  if (!match || !matchLinks) return undefined;

  const typeCandidates = [
    match?.entity_type,
    match?.entityType,
    entityTypeName,
    match?.type?.name,
    match?.type,
  ];

  for (const candidate of typeCandidates) {
    const direct = getMatchLinkValue(matchLinks, candidate);
    if (direct) return direct;
  }

  const idBasedPrefixes = [
    match?.lith_id != null || match?.lith_att_id != null ? ["lithology", "lith", "lithologies"] : [],
    match?.strat_name_id != null ? ["strat_name", "strat_names"] : [],
    match?.concept_id != null ? ["concept", "concepts"] : [],
    match?.interval_id != null ? ["interval", "intervals"] : [],
    match?.lith_att_id != null ? ["lith_att", "lith_atts"] : [],
  ];

  for (const prefixGroup of idBasedPrefixes) {
    for (const prefix of prefixGroup) {
      const value = getMatchLinkValue(matchLinks, prefix);
      if (value) return value;
    }
  }

  for (const prefix of ["lithology", "lith", "lithologies", "strat_name", "strat_names", "concept", "concepts", "interval", "intervals", "lith_att", "lith_atts"]) {
    const value = getMatchLinkValue(matchLinks, prefix);
    if (value) return value;
  }

  if (Object.keys(matchLinks).length === 1) {
    return matchLinks[Object.keys(matchLinks)[0]];
  }

  return undefined;
}

function getMatchLinkValue(matchLinks: Record<string, string>, candidate?: unknown) {
  if (!candidate) return undefined;

  const rawKey = String(candidate);
  const aliases = [rawKey, rawKey.toLowerCase(), rawKey.toUpperCase()];
  const normalizedAliases = [
    normalizeMatchLinkKey(rawKey),
    normalizeMatchLinkKey(rawKey.toLowerCase()),
    normalizeMatchLinkKey(rawKey.toUpperCase()),
  ];

  for (const alias of [...aliases, ...normalizedAliases]) {
    if (!alias) continue;
    const value = matchLinks[alias];
    if (value) return value;
  }

  return undefined;
}

function normalizeMatchLinkKey(key: string) {
  if (!key) return undefined;

  const normalized = key.toLowerCase().replace(/\s+/g, "_");
  const aliasMap = {
    lith: "lithology",
    lithology: "lithology",
    lithologies: "lithology",
    strat_name: "strat_name",
    strat_names: "strat_name",
    strat_name_concept: "concept",
    concept: "concept",
    concepts: "concept",
    interval: "interval",
    intervals: "interval",
    lith_att: "lith_att",
    lith_atts: "lith_att",
  };

  return aliasMap[normalized] ?? normalized;
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

export function HighlightedText(props: {
  text: string;
  allTags: AnnotateBlendTag[];
  lineHeight: string;
  allowOverlap?: boolean;
  dispatch: TreeDispatch;
  selectedNodes: number[];
  matchLinks?: {
    lithology: string;
    strat_name: string;
    lith_att: string;
  };
  viewOnly?: boolean;
}) {
  const {
    text,
    allTags = [],
    dispatch,
    selectedNodes,
    allowOverlap,
    matchLinks,
    viewOnly,
  } = props;

  const tree = nestHighlights(text, allTags);

  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      const tag = createTagFromSelection({ container: spanRef.current });
      if (!tag) return;
      addTag({ tag, dispatch, text, allTags, allowOverlap });
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [text, allTags, dispatch, allowOverlap]);

  return h(
    "span",
    { ref: spanRef },
    tree.children.map((child: any, i: number) =>
      renderNode(child, dispatch, selectedNodes, false, matchLinks, viewOnly),
    ),
  );
}
