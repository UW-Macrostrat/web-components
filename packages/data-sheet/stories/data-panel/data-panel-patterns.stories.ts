import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { ReactNode, useMemo, useState } from "react";
import { Button, PopoverNext, Spinner } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { TagEditor, type TagUsage } from "@macrostrat/data-components";
import {
  DataPanel,
  getSelectedRowIndices,
  LoadProgressIndicator,
  LoadProgressLabel,
  TableAction,
  useLoadControls,
  useSelector,
  useStoreAPI,
} from "../../src";
import { FlexRow } from "@macrostrat/ui-components";
import {
  addTagAction,
  ALL,
  container,
  fetchSamples,
  fullSpec,
  makeEditableProvider,
  removeTagAction,
  Sample,
  SampleCard,
  TAG_PALETTE,
  TaggedCard,
} from "./utils.ts";

/**
 * Miscellaneous progressive-enhancement patterns for `DataPanel` — the
 * composable seams beyond sort/filter: a `statusBar` slot, an inline
 * `contentFooter`, bulk-edit actions over a selection, and pausing/auto-load.
 * (Filter & sort patterns live in `data-panel-filtering.stories.ts`.) All use a
 * synthetic in-memory dataset (no backend) so the focus is the interaction
 * model, not the data source.
 */

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Misc. patterns",
  parameters: { layout: "fullscreen" },
};
export default meta;

// ---- 1. Footer below the scroll ----

/** A pinned `footer` slot below the scroll body — a persistent summary / action
 * bar that doesn't scroll with the list. */
export const WithFooter: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        name: "Samples",
        statusBar: h(FlexRow, [
          h(
            "div",
            {
              style: {
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
                gap: "8px",
                padding: "8px 10px",
                marginRight: "auto",
              },
            },
            [
              h(
                "span",
                { key: "t", style: { flex: 1 } },
                "Bulk actions apply to the current view",
              ),
              h(
                Button,
                { key: "e", small: true, icon: "export" },
                "Export all",
              ),
              h(
                Button,
                { key: "v", small: true, intent: "primary", icon: "confirm" },
                "Validate all",
              ),
            ],
          ),
          h(LoadProgressIndicator),
        ]),
      }),
    ),
};

// ---- 2. Editing: add / remove tags across a selection ----

function EditTagsDemo() {
  const provider = useMemo(makeEditableProvider, []);
  return container(
    h(DataPanel<Sample>, {
      provider,
      columnSpec: fullSpec,
      itemComponent: TaggedCard,
      actions: [addTagAction, removeTagAction],
      pageSize: 25,
      itemLabel: "sample",
    }),
  );
}

/**
 * **Editing base: bulk add/remove tags.** Select rows (shift/cmd), then "Add
 * tag" / "Remove tag" edit the whole selection. The actions are generic,
 * provider-agnostic module constants: they call `ctx.saveRows` (wired by
 * `DataPanel` to the provider, with auto-refresh) — no `refreshToken` or
 * provider closure. This is the immediate-mode edit seam the card/table views
 * share.
 */
export const EditTags: StoryObj = {
  name: "Edit: add/remove tags",
  render: () => h(EditTagsDemo),
};

// ---- 7b. Full-featured bulk tag editor (via the shared `TagEditor`) ----

// The selected rows, resolved from the shared store — recomputed after each
// edit (auto-refresh) so tag usage stays live while the popover is open.
function useSelectedRows(): Sample[] {
  const selection = useSelector((s: any) => s.selection);
  const data = useSelector((s: any) => s.data);
  return useMemo(
    () =>
      getSelectedRowIndices(selection)
        .map((i) => data[i] as Sample)
        .filter(Boolean),
    [selection, data],
  );
}

// Compute a tag's usage across a set of rows.
function tagUsage(rows: Sample[], tag: string): TagUsage {
  if (rows.length === 0) return "none";
  let n = 0;
  for (const r of rows) if (r.tags?.includes(tag)) n++;
  return n === 0 ? "none" : n === rows.length ? "all" : "partial";
}

// The "tool configuration": lightly couple the shared `TagEditor` to the data
// view — usage from the selected rows, `onChange`/`onCreate` through the shared
// edit seam (`rowEditing.saveRows`, auto-refresh, selection preserved).
function TagEditorControl() {
  const rows = useSelectedRows();
  const data = useSelector((s: any) => s.data);
  const storeAPI = useStoreAPI();
  const [created, setCreated] = useState<string[]>([]);

  // Available tags: base palette ∪ tags on loaded data ∪ session-created.
  const available = useMemo(() => {
    const set = new Set<string>([...TAG_PALETTE, ...created]);
    for (const r of data as Sample[]) {
      if (r != null) for (const t of r.tags ?? []) set.add(t);
    }
    return [...set].sort();
  }, [data, created]);

  const applyTag = (tag: string, add: boolean) => {
    const save = storeAPI.getState().rowEditing?.saveRows;
    save?.(
      rows.map((r) => ({
        ...r,
        tags: add
          ? [...new Set([...(r.tags ?? []), tag])]
          : (r.tags ?? []).filter((t) => t !== tag),
      })),
    );
  };

  return h(TagEditor, {
    tags: available,
    usage: (tag) => tagUsage(rows, tag),
    onChange: applyTag,
    onCreate: (tag) => {
      setCreated((c) => [...new Set([...c, tag])]);
      applyTag(tag, true);
    },
  });
}

function TagEditorButton() {
  const rows = useSelectedRows();
  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      content: h("div", { style: { padding: "6px" } }, h(TagEditorControl)),
    },
    h(
      Button,
      { small: true, minimal: true, icon: "tag", rightIcon: "caret-down" },
      `Tags (${rows.length})`,
    ),
  );
}

// A live-control edit action (like the sort/filter controls): renders the tag
// editor for the current row selection. Generic + provider-agnostic, so it
// works in both card and table views.
const tagEditorAction: TableAction<Sample> = {
  id: "tag-editor",
  name: "Tags",
  icon: "tag",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: false,
  render: () => h(TagEditorButton),
};

function BulkTagEditorDemo() {
  const provider = useMemo(makeEditableProvider, []);
  return container(
    h(DataPanel<Sample>, {
      provider,
      columnSpec: fullSpec,
      itemComponent: TaggedCard,
      actions: [tagEditorAction],
      pageSize: 25,
      name: "Samples",
    }),
  );
}

/**
 * **Full-featured bulk tag editor.** Select rows, open **Tags** → a searchable
 * list of every available tag, each showing its usage across the selection: a
 * checkbox (all selected have it), an indeterminate box (some do), or empty
 * (none). Click to add-to-all / remove-from-all; type to filter, or create a
 * new tag. Edits apply immediately through the shared edit seam and keep the
 * selection, so multiple tags can be set in one session. Works in card or table
 * view (it's a generic `render` action).
 */
export const BulkTagEditor: StoryObj = {
  name: "Bulk tag editor",
  render: () => h(BulkTagEditorDemo),
};

// ---- 8. Inline pausing footer + "Load more" (chrome out of the scroll flow) ----

// A deliberately space-taking inline footer, living at the end of the scroll
// flow (so it's seen only at the bottom). It folds in the counter (no bottom
// status bar), shows a spinner while a burst auto-loads, and a big "Load more"
// at each pause. `autoLoadPages: 2` pauses every second page.
function InlineFooter() {
  const c = useLoadControls();

  let action: ReactNode;
  if (!c.hasMore) {
    action = h("span", { style: { opacity: 0.6 } }, "Complete!");
  } else if (c.paused) {
    action = h(
      Button,
      {
        large: true,
        minimal: true,
        intent: "primary",
        icon: "chevron-down",
        onClick: c.loadMore,
      },
      "Load more",
    );
  } else {
    action = h(
      "span",
      {
        style: {
          display: "flex",
          gap: "8px",
          alignItems: "center",
          opacity: 0.7,
        },
      },
      [h(Spinner, { key: "s", size: 18 }), "Loading more…"],
    );
  }

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "36px 16px 56px",
        textAlign: "center",
      },
    },
    [
      action,
      h("div", { style: { fontSize: 12, opacity: 0.6 } }, h(LoadProgressLabel)),
    ],
  );
}

/**
 * **Chrome out of the scroll flow.** The footer is *inline* (`footerPlacement:
 * "inline"`) — the last thing in the scroll, seen only when you reach the
 * bottom — and doubles as the load sentinel: it spins while a burst auto-loads
 * and shows a big "Load more" at each pause (`autoLoadPages: 2` → every second
 * page). The counter is folded into it, so there's no bottom status bar
 * (`statusBar: false`). Default scrollbar clearance + top fade keep the rest of
 * the chrome clear of the content.
 */
export const PausingFooter: StoryObj = {
  name: "Inline pausing footer",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        itemLabel: "sample",
        pageSize: 20,
        autoLoadPages: 2,
        contentFooter: h(InlineFooter),
        statusBar: false,
      }),
    ),
};

