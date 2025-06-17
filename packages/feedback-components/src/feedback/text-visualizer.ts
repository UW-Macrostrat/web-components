import { AnnotateBlendTag, TextAnnotateBlend } from "react-text-annotate-blend";
import { InternalEntity } from "./types";
import { TreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { buildHighlights, getTagStyle } from "../extractions";
import { Highlight } from "../extractions/types";
import { useCallback, useEffect, useRef } from "react";
import { Tag } from "@macrostrat/data-components";
import { columnGeoJSONRecordToColumnIdentifier } from "packages/column-views/src/correlation-chart/prepare-data";

const h = hyper.styled(styles);

export interface FeedbackTextProps {
  text: string;
  selectedNodes: number[];
  nodes: InternalEntity[];
  updateNodes: (nodes: string[]) => void;
  dispatch: TreeDispatch;
  lineHeight: string;
  allowOverlap?: boolean;
}

function buildTags(
  highlights: Highlight[],
  selectedNodes: number[]
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
  const { text, selectedNodes, nodes, dispatch, lineHeight, allowOverlap } = props;
  const allTags: AnnotateBlendTag[] = buildTags(
    buildHighlights(nodes, null),
    selectedNodes
  );

  return h('div.feedback-text-wrapper', { 
    tabIndex: 0,
    onKeyDown: (e) => {
      if( e.key === "Backspace") {
        dispatch({
          type: "delete-node",
          payload: { ids: selectedNodes },
        });
      }
    }
  },
  h(HighlightedText, {
      text,
      allTags,
      lineHeight,
      allowOverlap, 
      dispatch,
    }), 
  );
}

function createTagFromSelection({ container }: { container: HTMLElement | null }) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !container) return null;

  const range = selection.getRangeAt(0);

  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
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
    text: selectedText
  };
}

function addTag({ tag, dispatch, text, allTags, allowOverlap }) {
  const { start, end } = tag;
  let payload = { start, end, text: text.slice(start, end) };

  if (payload.text.trim() === "") {
    console.log("Blank tag found, ignoring");
    return;
  }

  const duplicate = allTags.find(
    (t) => t.start === payload.start && t.end === payload.end
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
    (t) =>
      t.start <= payload.start &&
      t.end >= payload.end
  );

  const overlap = allTags.some(
    (t) => (t.start < payload.end && t.end > payload.start)
  );

  if ((inside || overlap) && !allowOverlap) {
    console.log("Tag is inside another tag, ignoring");
    return;
  }

  dispatch({ type: "create-node", payload });
}

export function HighlightedText(props: {
  text: string,
  allTags: AnnotateBlendTag[],
  lineHeight: string,
  allowOverlap?: boolean,
  dispatch: TreeDispatch,
}) {
  const { text, allTags = [], lineHeight, allowOverlap, dispatch } = props;
  const parts = [];
  let start = 0;

  console.log("Rendering highlighted text with allTags:", allTags);

  const sortedHighlights = allTags.sort((a, b) => a.start - b.start);
  const deconflictedHighlights = sortedHighlights.map((highlight, i) => {
    if (i === 0) return highlight;
    const prev = sortedHighlights[i - 1];
    if (highlight.start < prev.end) {
      highlight.start = prev.end;
    }
    return highlight;
  });

  for (const highlight of deconflictedHighlights) {
    const { start: s, end, ...rest } = highlight;
    parts.push(text.slice(start, s));
    parts.push(
      h("span.highlight", 
        { 
          style: rest, 
          onClick: () => dispatch({ type: "toggle-node-selected", payload: { ids: [highlight.id] } })
        }, text.slice(s, end)));
    start = end;
  }
  parts.push(text.slice(start));
  return h("span", { style: { lineHeight } }, parts);
}
