// Selection is "modal": a toolbar toggle enters select-mode. Outside it, a card
// is a link (its title navigates); inside it, cards show a checkbox and a click
// selects. So item interactivity and selection never fight over the click.
import {
  createDataCard,
  DataCard,
  DataPanel,
  ItemComponentProps,
  ScrollBodyProps,
} from "../../src";
import {
  Children,
  cloneElement,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";
import h from "@macrostrat/hyper";
import {
  cardStyle,
  CATEGORY_INTENT,
  container,
  fetchSamples,
  fullSpec,
  Sample,
} from "./utils.ts";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "@blueprintjs/core";

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Card styles",
  parameters: { layout: "fullscreen" },
};
export default meta;

// Deterministic but wildly variable body length per row (0–8 paragraphs), so
// card heights differ dramatically — the case that makes masonry balancing (and
// reflow) actually matter.
const LIPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim " +
  "veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea " +
  "commodo consequat.";

function blurbFor(id: number): string {
  const paragraphs = (id * 7) % 9; // 0–8
  return Array.from({ length: paragraphs }, () => LIPSUM).join("\n\n");
}

function MasonryCardContent({ data }) {
  return h([
    h("span", { key: "n", style: { fontWeight: 600 } }, data.name),
    h(
      Tag,
      { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
      data.category,
    ),
    h(
      "p",
      {
        key: "b",
        style: {
          margin: 0,
          fontSize: 12,
          opacity: 0.75,
          whiteSpace: "pre-line",
        },
      },
      blurbFor(data.id),
    ),
  ]);
}

const MasonryCard = createDataCard(MasonryCardContent, {
  style: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
    // Column children need their own vertical gap (multicol has no `gap`
    // between stacked items).
    marginBottom: "8px",
  },
});

const MASONRY_COLUMNS = 3;

/**
 * Append-only, height-balanced masonry — the fix for CSS-column reflow. Each
 * item is placed in the shortest column **once** and then frozen, so appending
 * a page never reshuffles what's on screen. Balance comes from *measuring each
 * item's real height* (via a ref on every card) rather than a flat estimate:
 * a freshly-appended batch renders in provisional columns, a `useLayoutEffect`
 * measures it, then greedily assigns each new item to the running-shortest
 * column from real heights and re-renders — all before paint, so only the
 * balanced result is seen. Already-frozen items are never remeasured into a new
 * column, so there's still no reflow. No dependency.
 */
function MasonryScrollBody({ children }: ScrollBodyProps) {
  const items = Children.toArray(children) as ReactElement[];
  const assignRef = useRef<number[]>([]); // finalized index → column
  const heightRef = useRef<number[]>([]); // measured height per index
  const elsRef = useRef<Map<number, HTMLElement>>(new Map());
  const [, bump] = useReducer((x) => x + 1, 0);

  // Reset if the list shrank/reset (sort, filter, refresh).
  if (items.length < assignRef.current.length) {
    assignRef.current = [];
    heightRef.current = [];
  }

  useLayoutEffect(() => {
    for (const [i, el] of elsRef.current)
      heightRef.current[i] = el.offsetHeight;
    const assign = assignRef.current;
    if (assign.length >= items.length) return;
    // Column heights from already-finalized items…
    const colH = new Array(MASONRY_COLUMNS).fill(0);
    for (let i = 0; i < assign.length; i++) {
      colH[assign[i]] += heightRef.current[i] ?? 0;
    }
    // …then greedily place the new batch by its just-measured real heights.
    for (let i = assign.length; i < items.length; i++) {
      let col = 0;
      for (let c = 1; c < MASONRY_COLUMNS; c++) {
        if (colH[c] < colH[col]) col = c;
      }
      assign[i] = col;
      colH[col] += heightRef.current[i] ?? 160;
    }
    bump(); // re-render to move the new batch into its balanced columns
  });

  // Unfinalized (new) items render in a provisional column so they mount and
  // can be measured; the layout effect above then finalizes them.
  const columns: ReactNode[][] = Array.from(
    { length: MASONRY_COLUMNS },
    () => [],
  );
  items.forEach((child, i) => {
    const col = assignRef.current[i] ?? i % MASONRY_COLUMNS;
    columns[col].push(
      cloneElement(child, {
        ref: (el: HTMLElement | null) => {
          if (el) elsRef.current.set(i, el);
          else elsRef.current.delete(i);
        },
      } as any),
    );
  });

  return h(
    "div",
    { style: { display: "flex", gap: "8px", alignItems: "flex-start" } },
    columns.map((col, c) =>
      h(
        "div",
        {
          key: c,
          style: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          },
        },
        col,
      ),
    ),
  );
}

/**
 * A masonry layout for variable-height items via a custom `scrollBody`. Uses an
 * append-only, measured column distribution (see `MasonryScrollBody`) so new
 * pages don't reflow the existing layout. Paging and selection are unaffected.
 */
export const Masonry: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: MasonryCard,
        pageSize: 24,
        name: "Samples",
        scrollBody: MasonryScrollBody,
      }),
    ),
};
function GridCard({
  data,
  selected,
  onSelect,
  selectable,
}: ItemComponentProps<Sample>) {
  return h(
    DataCard,
    {
      onSelect,
      selected,
      selectable,
      style: {
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
        height: "100%",
      },
    },
    [
      h("span", { key: "n", style: { fontWeight: 600 } }, data.name),
      h(
        Tag,
        { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
        data.category,
      ),
      h("code", { key: "v", style: { fontSize: 12 } }, `value ${data.value}`),
    ],
  );
}

// A custom scroll-body component: lays the cards out as a CSS grid. It's a
// component (not just a style), so it could just as well add section headers,
// sticky bits, or its own windowing — the panel still owns scroll + paging.
function GridScrollBody({ children }: { children: any }) {
  return h(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "8px",
        alignContent: "start",
      },
    },
    children,
  );
}

/**
 * Several items per row via a custom `scrollBody` component. Paging (windowed
 * `fetchData`) and modifier-key selection are layout-agnostic, so infinite
 * scroll and shift/cmd-select keep working across the grid.
 */
export const GridLayout: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: GridCard,
        pageSize: 24,
        name: "Samples",
        scrollBody: GridScrollBody,
      }),
    ),
};
