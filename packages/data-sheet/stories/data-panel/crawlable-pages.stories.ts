import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { createLocalProvider, DataPanel, rowsAfter } from "../../src";
import { ALL, container, fullSpec, Sample, SampleCard } from "./utils.ts";

/**
 * An infinite-scrolling list that a crawler can still walk page by page.
 *
 * Two props, both plain links so they work in server-rendered HTML with no
 * script:
 *
 *  - **`pageLinks.after(row)`** — the href of the view that starts after a row.
 *    The panel renders it as a visually hidden `rel="next"` link after the
 *    loaded rows, so a crawler following the HTML reaches every page while
 *    readers keep the infinite scroll. It is never written to the browser's
 *    URL as the list is scrolled.
 *  - **`startAfter`** — the row identity a view begins after (read from
 *    `?after=` when the page loads). The provider receives it as `after` on
 *    every chunk of that view; the local provider slices past the row, a keyset
 *    source would add `WHERE key > after`. With **`pageLinks.top`** set, a
 *    "Return to top" notice heads the content. The first view change (a sort,
 *    a filter, a refresh) drops the cursor, since it only described that view.
 *
 * Seed the rows after the cursor as `initialData` and the whole page — rows,
 * notice, next link — is complete in the server render.
 *
 * The next link is hidden by design; these stories reveal it (dashed outline)
 * so the target can be read.
 */
const meta: Meta<any> = {
  title: "Data sheet/Data panel/Crawlable pages",
  parameters: { layout: "fullscreen" },
};
export default meta;

const PAGE_SIZE = 20;
const identity = (row: Sample) => row.id;
const provider = createLocalProvider(ALL, { identity });

const pageLinks = {
  after: (row: Sample) => `?after=${row.id}`,
  top: "?",
};

/** Story-only: make the hidden next link visible. */
const reveal = h("style", {}, `
  a[rel="next"] {
    position: static !important; width: auto !important; height: auto !important;
    clip-path: none !important; overflow: visible !important;
    display: inline-block; margin: 8px 0; padding: 4px 8px;
    border: 1px dashed currentColor; border-radius: 4px; font-size: 12px;
  }
  a[rel="next"]::after { content: " → " attr(href); opacity: 0.7; }
`);

function CrawlablePanel({ startAfter }: { startAfter: number | null }) {
  // What a server would do for `?after=<id>`: seed the first page after it.
  const rows = rowsAfter(ALL, startAfter, identity);
  const initialData = { rows: rows.slice(0, PAGE_SIZE), totalCount: rows.length };
  return container(
    h([
      reveal,
      h(DataPanel<Sample>, {
        name: "Samples",
        itemLabel: "sample",
        provider,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        pageSize: PAGE_SIZE,
        autoLoadPages: 1,
        initialData,
        startAfter,
        pageLinks,
      }),
    ]),
  );
}

/** The first page: no notice; the hidden next link points after row 20. */
export const FirstPage: StoryObj = {
  render: () => h(CrawlablePanel, { startAfter: null }),
};

/** A deep page reached through a link (`?after=60`): the list is continued
 * after that row, the notice offers "Return to top", and the next link points
 * after row 80. Change a sort or filter and the cursor is dropped. */
export const DeepPage: StoryObj = {
  render: () => h(CrawlablePanel, { startAfter: 60 }),
};
