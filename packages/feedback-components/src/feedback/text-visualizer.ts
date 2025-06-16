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
  let allTags: AnnotateBlendTag[] = buildTags(
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
      dispatch,
      selectedNodes,
      allowOverlap
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
  text: string;
  allTags: AnnotateBlendTag[];
  lineHeight?: string;
  dispatch: any;
  allowOverlap: boolean;
  selectedNodes: any[];
}) {
  const { text, allTags = [], lineHeight, dispatch, allowOverlap, selectedNodes } = props;
  const parts = [];
  let start = 0;
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

  const sortedTags = [...allTags].sort((a, b) => {
    if (a.start === b.start) {
      return (a.end - a.start) - (b.end - b.start);
    }
    return a.start - b.start;
  });

  const selectedTag = allTags.find(tag => selectedNodes?.includes(tag.id));
  const claimedRanges: Array<[number, number]> = [];

  for (const tag of sortedTags) {
    const found = tag.text === "Gowganda Formation"

    if (found) {
      console.log("Found tag:", tag);
    }

    // Skip inner tags if bigger tag is selected — keep as is
    if (
      selectedTag &&
      selectedTag.id !== tag.id &&
      tag.start >= selectedTag.start &&
      tag.end <= selectedTag.end
    ) {
      continue;
    }

    const { start: tagStart, end: tagEnd, ...rest } = tag;

    // Find nested tags fully inside this tag (excluding itself)
    const nestedTags = sortedTags.filter(
      (t) => t.id !== tag.id && t.start >= tagStart && t.end <= tagEnd
    );

    // Start with full range of this tag
    let rangesToRender: Array<[number, number]> = [[tagStart, tagEnd]];

    // Subtract nested tag ranges from bigger tag ranges
    if (!selectedNodes.includes(tag.id)) {
      for (const nested of nestedTags) {
        const newRanges: typeof rangesToRender = [];
        for (const [rStart, rEnd] of rangesToRender) {
          if (nested.end <= rStart || nested.start >= rEnd) {
            // No overlap, keep as is
            newRanges.push([rStart, rEnd]);
          } else {
            // Overlap — cut out nested tag range
            if (rStart < nested.start) newRanges.push([rStart, nested.start]);
            if (rEnd > nested.end) newRanges.push([nested.end, rEnd]);
          }
        }
        rangesToRender = newRanges;
        if (rangesToRender.length === 0) break; // fully carved out
      }
    } else {
      // If selected, don't cut nested tags — render full range
      rangesToRender = [[tagStart, tagEnd]];
    }

    if(found) {
      console.log("Ranges to render for tag:", tag, rangesToRender);
    }

    for (const [s, e] of rangesToRender) {
      if (start < s) {
        parts.push(text.slice(start, s));
      }
      
      
      const index = parts.indexOf(tag.text);

      if(index !== -1) {
          parts[index] = h(
          "span.highlight",
          {
            style: {
              ...rest,
              position: "relative",
              zIndex: 10,
            },
            onClick: () => {
              dispatch({
                type: "toggle-node-selected",
                payload: { ids: [tag.id] },
              });
            },
          },
          text.slice(s, e)
        )
      } else {
        // If the tag is not found in parts, create a new highlight span
        parts.push(
          h(
            "span.highlight",
            {
              style: {
                ...rest,
                position: "relative",
                zIndex: 10,
              },
              onClick: () => {
                dispatch({
                  type: "toggle-node-selected",
                  payload: { ids: [tag.id] },
                });
              },
            },
            text.slice(s, e)
          )
        );
      }

      claimedRanges.push([s, e]);
      start = e;
    }
  }


  if (start < text.length) {
    parts.push(text.slice(start));
  }

  return h(
    "span",
    {
      ref: spanRef,
      style: { lineHeight },
    },
    parts
  );
}
