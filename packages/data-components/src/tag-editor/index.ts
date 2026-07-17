/**
 * TagEditor — a view-agnostic bulk tag editor UI.
 *
 * A searchable list of available tags, each showing its **usage across the
 * current selection** (none / partial / all → empty / indeterminate /
 * checked), plus create-new. It knows nothing about data tables, stores, or
 * providers: the caller supplies the available tags, a `usage(tag)` lookup, and
 * `onChange` / `onCreate` callbacks. A `DataSheet` / `DataPanel` "tool" (a
 * `TableAction`) lightly couples it to the selection + edit seam; other
 * consumers can drop it anywhere.
 */
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { Checkbox, InputGroup, Menu, MenuItem } from "@blueprintjs/core";
import chroma from "chroma-js";
import { Tag, TagSize } from "../components/unit-details/tag";
import styles from "./tag-editor.module.sass";

const h = hyper.styled(styles);

/** A tag's usage across the current selection. */
export type TagUsage = "none" | "partial" | "all";

export interface TagEditorTag {
  name: string;
  color?: chroma.ChromaInput;
}

export interface TagEditorProps {
  /** Available tags — plain names, or `{ name, color }`. */
  tags: Array<string | TagEditorTag>;
  /** Usage of a tag across the current selection. */
  usage: (tag: string) => TagUsage;
  /** Set a tag on the selection: `add` is `true` when the click should apply it
   * to all (from none/partial), `false` to remove it from all (from all). */
  onChange: (tag: string, add: boolean) => void;
  /** Create (and apply) a new tag. Omit to disable creation. */
  onCreate?: (tag: string) => void;
  /** Color for a tag when `tags` are plain names (or to override). */
  colorForTag?: (tag: string) => chroma.ChromaInput | undefined;
  searchPlaceholder?: string;
  className?: string;
}

export function TagEditor(props: TagEditorProps) {
  const {
    tags,
    usage,
    onChange,
    onCreate,
    colorForTag,
    searchPlaceholder = "Search or add a tag…",
    className,
  } = props;
  const [query, setQuery] = useState("");

  const normalized: TagEditorTag[] = tags.map((t) =>
    typeof t === "string" ? { name: t } : t,
  );
  const q = query.trim().toLowerCase();
  const filtered = normalized.filter((t) => t.name.toLowerCase().includes(q));
  const exact = normalized.some((t) => t.name.toLowerCase() === q);
  const canCreate = onCreate != null && q !== "" && !exact;

  const doCreate = () => {
    const t = query.trim();
    if (t === "") return;
    onCreate?.(t);
    setQuery("");
  };

  return h("div.tag-editor", { className }, [
    h(InputGroup, {
      key: "search",
      small: true,
      leftIcon: "search",
      placeholder: searchPlaceholder,
      value: query,
      autoFocus: true,
      onChange: (e: any) => setQuery(e.target.value),
      onKeyDown: (e: any) => {
        if (e.key === "Enter" && canCreate) doCreate();
      },
    }),
    h(
      "div.tag-list",
      { key: "list" },
      filtered.map((t) => {
        const u = usage(t.name);
        return h(
          "div.tag-row",
          { key: t.name, onClick: () => onChange(t.name, u !== "all") },
          [
            h(Checkbox, {
              key: "cb",
              checked: u === "all",
              indeterminate: u === "partial",
              readOnly: true,
            }),
            h(Tag, {
              key: "tag",
              name: t.name,
              size: TagSize.Small,
              color: t.color ?? colorForTag?.(t.name),
            }),
          ],
        );
      }),
    ),
    canCreate
      ? h(
          Menu,
          { key: "create", className: "create-menu" },
          h(MenuItem, {
            icon: "plus",
            intent: "primary",
            text: `Create "${query.trim()}"`,
            onClick: doCreate,
          }),
        )
      : null,
    filtered.length === 0 && !canCreate
      ? h("div.empty", { key: "empty" }, "No tags")
      : null,
  ]);
}
