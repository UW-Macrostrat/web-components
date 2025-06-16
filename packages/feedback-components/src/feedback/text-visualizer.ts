import { AnnotateBlendTag, TextAnnotateBlend } from "react-text-annotate-blend";
import { InternalEntity } from "./types";
import { TreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { buildHighlights, getTagStyle } from "../extractions";
import { Highlight } from "../extractions/types";
import { useCallback } from "react";
import { Tag } from "@macrostrat/data-components";

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

    tags.push({
      color: tagStyle.backgroundColor,
      tagStyle: {
        display: "none",
      },
      markStyle: {
          fontWeight: active ? "bold" : "normal",
        },
      ...highlight,
    });

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

  let clicked = false;

  const onChange = useCallback(
    (tags, e) => {
      // New tags
      const newTags = tags.filter((d) => !("id" in d));
      if (newTags.length > 0) {
        const { start, end } = newTags[0];
        let payload = { start, end, text: text.slice(start, end) };

        // check if blank
        if (payload.text === " ") {
          console.log("Blank tag found, ignoring");
          return;
        }

        // check if duplicate
        const duplicate = tags.find(
          (tag) => tag.start === payload.start && tag.end === payload.end - 1
        );

        if (duplicate) {
          console.log("Duplicate tag found, ignoring");
          return;
        }

        // remove ending whitespace if needed
        if( payload.text.endsWith(" ")) {
          payload.text = payload.text.slice(0, -1);
          payload.end -= 1;
        }

        const overlap = tags.some(
            (tag) =>
              tag.start <= payload.start &&
              tag.end >= payload.end &&
              tag.id !== undefined);

        // check if inside
        if (overlap && !allowOverlap) {
          console.log("Tag is inside another tag, ignoring");
          return;
        }

        dispatch({ type: "create-node", payload });
        return;
      }

      // allow nested tags to be clicked
      if (!clicked) {
        clicked = true;

        const tagIDs = new Set(tags.map((d) => d.id));
        const removedIds = allTags.map((d) => d.id).filter((d) => !tagIDs.has(d));

        if (removedIds.length > 0) {
          dispatch({
            type: "toggle-node-selected",
            payload: { ids: removedIds },
          });
        }
      }
    },
    [allTags, text]
  );

  const value = allTags
  console.log("FeedbackText value", value);

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
    h(TextAnnotateBlend, {
      style: {
        fontSize: "1.2em",
        lineHeight,
      },
      className: "feedback-text",
      content: text,
      onChange,
      value,
    })
  );
}