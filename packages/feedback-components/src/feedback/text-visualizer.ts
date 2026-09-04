import { AnnotateBlendTag } from "react-text-annotate-blend";
import { InternalEntity } from "./types";
import { TreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";
import { buildHighlights, getMatchUrl, getTagStyle } from "../extractions";
import { EntityType, Highlight } from "../extractions/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Popover } from "@blueprintjs/core";
import { MatchTag } from "./matches";
import classNames from "classnames";

const h = hyper.styled(styles);

export interface FeedbackTextProps {
  text: string;
  selectedNodes: number[];
  nodes: InternalEntity[];
  dispatch: TreeDispatch;
  /** The type a newly tagged span will get (shown on the tagging control). */
  selectedEntityType?: EntityType;
  allowOverlap?: boolean;
  matchLinks?: Record<string, string>;
  viewOnly?: boolean;
  /** Create an entity as soon as text is selected, without confirmation (the
   * pre-2.3 behavior). Off by default: selecting text shows a "Tag" control. */
  autoCreateTags?: boolean;
}

/** A span of text the reviewer has selected but not yet tagged. */
interface PendingTag {
  start: number;
  end: number;
  text: string;
  /** Position for the floating control, relative to the text wrapper. */
  left: number;
  top: number;
}

export function FeedbackText(props: FeedbackTextProps) {
  const {
    text,
    selectedNodes,
    nodes,
    dispatch,
    allowOverlap,
    matchLinks,
    viewOnly,
    selectedEntityType,
    autoCreateTags = false,
  } = props;
  const allTags: AnnotateBlendTag[] = buildTags(
    buildHighlights(nodes, null),
    selectedNodes,
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingTag | null>(null);

  const createTag = useCallback(
    (tag: PendingTag) => {
      dispatch({
        type: "create-node",
        payload: { start: tag.start, end: tag.end, text: tag.text },
      });
      setPending(null);
      window.getSelection()?.removeAllRanges();
    },
    [dispatch],
  );

  // Keyboard grammar, shared with the graph view: Escape clears, Backspace /
  // Delete removes the selection, Enter confirms a pending tag, M merges.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (viewOnly) return;
    if (e.key === "Escape") {
      setPending(null);
      dispatch({ type: "deselect" });
    } else if (e.key === "Enter" && pending != null) {
      e.preventDefault();
      createTag(pending);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      // Not while the browser has a text selection: that is a pending tag,
      // not a request to delete entities.
      if (pending != null) return;
      dispatch({ type: "delete-node", payload: { ids: selectedNodes } });
    } else if (e.key === "m" && selectedNodes.length > 1) {
      dispatch({ type: "merge-nodes" });
    }
  };

  // A click on plain text (highlights stop propagation) clears the selection.
  const onClick = () => {
    if (viewOnly) return;
    const selection = window.getSelection();
    if (selection != null && !selection.isCollapsed) return;
    dispatch({ type: "deselect" });
  };

  const onPendingTag = useCallback(
    (tag: PendingTag | null) => {
      if (tag == null) return;
      if (autoCreateTags) {
        createTag(tag);
        return;
      }
      // A new text selection supersedes the node selection, so the type
      // picker acts on the tag about to be created rather than on nodes.
      dispatch({ type: "deselect" });
      setPending(tag);
    },
    [autoCreateTags, createTag, dispatch],
  );

  let pendingControl = null;
  if (pending != null && !viewOnly) {
    pendingControl = h(PendingTagControl, {
      pending,
      entityType: selectedEntityType,
      onConfirm: () => createTag(pending),
      onChangeType: () =>
        dispatch({ type: "toggle-entity-type-selector", payload: true }),
      onCancel: () => setPending(null),
    });
  }

  return h(
    "div.feedback-text-wrapper",
    { ref: wrapperRef, tabIndex: 0, onKeyDown, onClick },
    [
      h(HighlightedText, {
        text,
        allTags,
        allowOverlap,
        dispatch,
        selectedNodes,
        viewOnly,
        matchLinks,
        wrapperRef,
        autoCreateTags,
        onPendingTag,
      }),
      pendingControl,
    ],
  );
}

/** Floating control under a text selection: confirm the tag (with the type it
 * will get), pick another type, or dismiss. */
function PendingTagControl({
  pending,
  entityType,
  onConfirm,
  onChangeType,
  onCancel,
}: {
  pending: PendingTag;
  entityType?: EntityType;
  onConfirm(): void;
  onChangeType(): void;
  onCancel(): void;
}) {
  const typeName = entityType?.name ?? "entity";
  return h(
    "div.pending-tag",
    {
      style: { left: pending.left, top: pending.top },
      // Keep the browser selection and focus while interacting with the control.
      onMouseDown: (e) => e.preventDefault(),
      onClick: (e) => e.stopPropagation(),
    },
    h(ButtonGroup, { minimal: true, small: true }, [
      h(Button, { intent: "primary", icon: "tag", onClick: onConfirm }, [
        h("span.pending-tag-swatch", {
          style: { backgroundColor: entityType?.color },
        }),
        `Tag as ${typeName}`,
      ]),
      h(Button, {
        icon: "caret-down",
        title: "Choose another type",
        onClick: onChangeType,
      }),
      h(Button, { icon: "cross", title: "Cancel", onClick: onCancel }),
    ]),
  );
}

function buildTags(
  highlights: Highlight[],
  selectedNodes: number[],
): AnnotateBlendTag[] {
  let tags: AnnotateBlendTag[] = [];
  // An entity reached through several parents appears once per span; a merged
  // entity contributes one tag per span.
  const seen = new Set<string>();

  for (const highlight of highlights) {
    const key = `${highlight.id}:${highlight.start}`;
    if (seen.has(key)) continue;

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
    seen.add(key);
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

/** The current browser selection as character offsets into the paragraph, or
 * null if it is empty or lies outside the container. */
function rangeFromSelection(container: HTMLElement | null) {
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

  return { start, end, text: selectedText, range };
}

/** Snap a raw selection to word boundaries and reject empty, duplicate, or
 * (unless allowed) overlapping spans. Returns the span to tag, or null. */
function normalizeTag({
  tag,
  text,
  allTags,
  allowOverlap,
}: {
  tag: { start: number; end: number };
  text: string;
  allTags: AnnotateBlendTag[];
  allowOverlap?: boolean;
}) {
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

  if (payload.text.trim() === "") return null;

  const duplicate = allTags.find(
    (t) =>
      t.start === payload.start &&
      (t.end === payload.end || t.end === payload.end - 1),
  );
  if (duplicate) return null;

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

  if ((inside || overlap) && !allowOverlap) return null;

  return payload;
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
  matchLinks?: Record<string, string>,
  viewOnly?: boolean,
): any {
  if (typeof node === "string") return node;

  const { tag, children } = node;
  const isSelected = selectedNodes?.includes(tag.id);
  const showBorder = selectedNodes.length === 0 || isSelected;
  const match = tag.match;

  let borderColor = "transparent";
  if (match != undefined && matchLinks) {
    borderColor = "orange";
  } else if (showBorder) {
    borderColor = tag.color;
  }

  const style = {
    ...tag,
    zIndex: parentSelected ? -1 : 1,
    border: "1px solid " + borderColor,
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

  let url: string | undefined = undefined;
  if (viewOnly && match) {
    url = getMatchUrl(match, matchLinks, tag.type?.name ?? tag.term_type);
  }

  let onClick = undefined;
  if (url == null) {
    onClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (viewOnly) return;
      if (
        e.ctrlKey ||
        e.metaKey ||
        (selectedNodes[0] === tag.id && selectedNodes.length === 1)
      ) {
        // Toggle selection on ctrl/cmd click or when node is only selected node
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
    };
  }

  let content;
  if (isSelected) {
    content = moveText.flat();
  } else {
    content = children.map((child: any) =>
      renderNode(child, dispatch, selectedNodes, isSelected, matchLinks, viewOnly),
    );
  }

  let tagName = "span";
  if (url != null) tagName = "a.highlight-link";

  const tagComponent = h(
    tagName,
    {
      onMouseEnter: (e: MouseEvent) => {
        e.stopPropagation();
      },
      className: classNames("highlight", { clickable: !viewOnly || match }),
      style,
      href: url,
      target: url ? "_blank" : undefined,
      rel: url ? "noreferrer noopener" : undefined,
      onClick,
    },
    content,
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

export function HighlightedText(props: {
  text: string;
  allTags: AnnotateBlendTag[];
  allowOverlap?: boolean;
  dispatch: TreeDispatch;
  selectedNodes: number[];
  matchLinks?: Record<string, string>;
  viewOnly?: boolean;
  autoCreateTags?: boolean;
  wrapperRef: React.RefObject<HTMLElement>;
  /** Called with the normalized span when the reviewer finishes selecting text. */
  onPendingTag: (tag: PendingTag | null) => void;
}) {
  const {
    text,
    allTags = [],
    dispatch,
    selectedNodes,
    allowOverlap,
    matchLinks,
    viewOnly,
    wrapperRef,
    onPendingTag,
  } = props;

  const tree = nestHighlights(text, allTags);

  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (viewOnly) return;
    const handleMouseUp = () => {
      const raw = rangeFromSelection(spanRef.current);
      if (!raw) return;
      const payload = normalizeTag({ tag: raw, text, allTags, allowOverlap });
      if (!payload) return;
      // Anchor the control under the end of the selection.
      const rect = raw.range.getBoundingClientRect();
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      const left = rect.left - (wrapperRect?.left ?? 0);
      const top = rect.bottom - (wrapperRect?.top ?? 0) + 4;
      onPendingTag({ ...payload, left, top });
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [text, allTags, allowOverlap, viewOnly, onPendingTag, wrapperRef]);

  return h(
    "span",
    { ref: spanRef },
    tree.children.map((child: any) =>
      renderNode(child, dispatch, selectedNodes, false, matchLinks, viewOnly),
    ),
  );
}
