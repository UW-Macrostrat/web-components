import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "./data-panel.stories.module.sass";
import { useMemo } from "react";
import { Intent, Tag } from "@blueprintjs/core";
import {
  createPostgRESTProvider,
  DataPanel,
  DataPanelItemProps,
  TableAction,
} from "../src";
import { RegionCardinality } from "@blueprintjs/table";
import type { ColumnSpec } from "../src";

/**
 * DataPanel is the card-list renderer over the same headless core as
 * `DataSheet` (loader + view state + selection + actions). This story drives it
 * live against Macrostrat's map-ingestion queue — a **standard PostgREST route**
 * (`/api/v3/map-ingestion/pg/maps`), so the exact same provider that will back
 * the production page runs here in the library. Server-side filter / sort /
 * paginate all work against real data.
 *
 * Requires the local Macrostrat stack (`macrostrat.local`).
 */

// The PostgREST base; `.from("maps")` → `${endpoint}/maps`.
const endpoint = "https://macrostrat.local/api/v3/map-ingestion/pg";

interface IngestMap {
  source_id: number;
  slug: string;
  name: string;
  url: string;
  ref_year: string;
  scale: string;
  state: string;
  tags: string[];
}

// Facet capabilities are declared per-column, backend-agnostic. `FacetControls`
// + the server provider read these to offer/apply filter & sort.
const columnSpec: ColumnSpec[] = [
  { key: "name", name: "Name", dataType: "text", filterable: true, sortable: true },
  { key: "state", name: "Status", dataType: "string", filterable: true, sortable: true },
  { key: "scale", name: "Scale", dataType: "string", filterable: true, sortable: true },
  { key: "ref_year", name: "Year", dataType: "string", filterable: true, sortable: true },
  { key: "source_id", name: "Source ID", dataType: "integer", sortable: true },
  // Array column — display only for now. Server-side tag filtering needs an
  // array operator (`cs`), the clearly-scoped next increment (see workbench).
  { key: "tags", name: "Tags", dataType: "array" },
];

const STATE_INTENT: Record<string, Intent> = {
  failed: "danger",
  pending: "warning",
  processing: "primary",
  succeeded: "success",
  abandoned: "none",
};

function MapCard({ data, toggleSelected }: DataPanelItemProps<IngestMap>) {
  return h(
    "div.map-card",
    {
      onClick: (e: React.MouseEvent) =>
        toggleSelected({ additive: e.metaKey || e.ctrlKey }),
    },
    [
      h("div.card-header", { key: "header" }, [
        h("span.map-name", { key: "name" }, data.name ?? data.slug),
        h.if(data.state != null)(Tag, {
          key: "state",
          minimal: true,
          intent: STATE_INTENT[data.state] ?? "none",
          children: data.state,
        }),
      ]),
      h("div.map-meta", { key: "meta" }, [
        h.if(data.scale != null)("span", { key: "scale" }, `Scale: ${data.scale}`),
        h.if(data.ref_year != null)("span", { key: "year" }, data.ref_year),
        h("span", { key: "id" }, `#${data.source_id}`),
      ]),
      h.if(Array.isArray(data.tags) && data.tags.length > 0)(
        "div.tags",
        { key: "tags" },
        (data.tags ?? []).map((t) =>
          h(Tag, { key: t, minimal: true, round: true, children: t }),
        ),
      ),
    ],
  );
}

// A set-based action demonstrating the shared selection/action machinery. It
// operates on the selected rows (kept side-effect-free for the spike — a real
// archive/tag/delete would call the provider's mutation methods).
const archiveAction: TableAction<IngestMap> = {
  id: "archive-maps",
  name: "Archive",
  icon: "archive",
  intent: "warning",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: false,
  run(ctx) {
    const ids = ctx.getSelectedRowIndices().map((i) => ctx.data[i]?.source_id);
    // eslint-disable-next-line no-alert
    window.alert(`Would archive maps: ${ids.join(", ")}`);
    ctx.clearSelection();
  },
};

function IngestionListPanel() {
  const provider = useMemo(
    () =>
      createPostgRESTProvider<IngestMap>({
        endpoint,
        table: "maps",
        identityKey: "source_id",
        baseOrder: [{ key: "source_id", ascending: true }],
      }),
    [],
  );

  return h(
    "div.data-panel-container",
    h(DataPanel<IngestMap>, {
      provider,
      columnSpec,
      itemComponent: MapCard,
      actions: [archiveAction],
      name: "Map ingestion queue",
      pageSize: 50,
    }),
  );
}

const meta: Meta<typeof IngestionListPanel> = {
  title: "Data sheet/Data panel",
  component: IngestionListPanel,
  parameters: { layout: "fullscreen" },
};

export default meta;

export const IngestionQueue: StoryObj = {};
