import { AnnotateBlendTag, TextAnnotateBlend } from "react-text-annotate-blend";
import { InternalEntity } from "./types";
import { TreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { buildHighlights, getTagStyle } from "../extractions";
import { Highlight } from "../extractions/types";
import { useCallback } from "react";

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

    tags.push({
      markStyle: {
        ...getTagStyle(highlight.backgroundColor, {
          highlighted,
          active,
        }),
        borderRadius: "0.2em",
        padding: "0.1em",
        borderWidth: "1.5px",
        cursor: "pointer",
      },
      tagStyle: {
        display: "none",
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
              tag.start <= payload.start ||
              tag.end >= payload.end ||
              tag.id !== undefined);

        // check if inside
        if (overlap && !allowOverlap) {
          console.log("Tag is inside another tag, ignoring");
          return;
        }

        dispatch({ type: "create-node", payload });
        return;
      }

      const tagIDs = new Set(tags.map((d) => d.id));
      const removedIds = allTags.map((d) => d.id).filter((d) => !tagIDs.has(d));

      console.log("Removed IDs", removedIds);

      /* Find the id that was removed: that is the one that will be selected
       (we are hijacking the 'click to delete' functionality to select instead) */
      if (removedIds.length > 0) {
        dispatch({
          type: "toggle-node-selected",
          payload: { ids: removedIds },
        });
      }
    },
    [allTags, text]
  );

  const value = allTags.map(({ text, backgroundColor, ...rest }) => { return { ...rest, color: backgroundColor }; });


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
