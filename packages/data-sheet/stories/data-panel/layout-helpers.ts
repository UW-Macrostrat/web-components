import { createDataCard, ScrollBodyProps } from "../../src";
import {
  Children,
  cloneElement,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import h from "@macrostrat/hyper";
import { Tag } from "@blueprintjs/core";
import { CATEGORY_INTENT } from "./utils.ts";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum();

function blurbFor(id: number): ReactNode[] {
  const paragraphs = (id * 7) % 9; // 0–8
  const paras = lorem.generateParagraphs(paragraphs).split("\n");
  return paras.map((p) => h("p", p));
}

function MasonryCardContent({ data }) {
  const paras = useMemo(() => blurbFor(data.id), [data.id]);
  return h([
    h("span", { style: { fontWeight: 600 } }, data.name),
    h(
      Tag,
      { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
      data.category,
    ),
    paras,
  ]);
}

export const MasonryCard = createDataCard(MasonryCardContent, {
  style: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  className: "masonry-card",
});
const MASONRY_COLUMNS = 2;

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
export function MasonryScrollBody({ children }: ScrollBodyProps) {
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
    {
      style: {
        display: "flex",
        gap: "var(--data-panel-item-gap)",
        alignItems: "flex-start",
      },
    },
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
