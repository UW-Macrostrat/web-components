import { AnnotateBlendTag } from "react-text-annotate-blend";
import { InternalEntity } from "./types";
import { TreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { buildHighlights, getTagStyle } from "../extractions";
import { Highlight } from "../extractions/types";
import { useEffect, useRef } from "react";

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
  const { text, selectedNodes, nodes, dispatch, allowOverlap } = props;
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
  const { start, end } = tag;
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
): any {
  if (typeof node === "string") return node;

  const { tag, children } = node;
  const isSelected = selectedNodes?.includes(tag.id);

  const style = {
    ...tag,
    zIndex: parentSelected ? -1 : 1,
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

  return h(
    "span",
    {
      className: "highlight",
      style,
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        dispatch({
          type: "toggle-node-selected",
          payload: { ids: [tag.id] },
        });
      },
    },
    isSelected
      ? moveText.flat()
      : children.map((child: any, i: number) =>
          renderNode(child, dispatch, selectedNodes, isSelected),
        ),
  );
}

export function HighlightedText(props: {
  text: string;
  allTags: AnnotateBlendTag[];
  lineHeight: string;
  allowOverlap?: boolean;
  dispatch: TreeDispatch;
  selectedNodes: number[];
}) {
  const { text, allTags = [], dispatch, selectedNodes, allowOverlap } = props;

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
      renderNode(child, dispatch, selectedNodes, false),
    ),
  );
}
