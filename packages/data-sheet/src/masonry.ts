/**
 * Masonry scroll body for the `DataPanel` — variable-height cards laid out in
 * equal-width columns, balanced by *measured* height rather than a flat
 * estimate or CSS multi-column.
 *
 * The problem it solves is paging: CSS `columns` re-flows the whole list every
 * time a page is appended, so the cards under the user's cursor move. Here each
 * item is placed in the running-shortest column **once**, keyed by its React
 * key, and then frozen — appending a page never reshuffles what is on screen.
 *
 * Placement is measured: a freshly-appended batch mounts in provisional
 * columns, a `useLayoutEffect` reads each card's real `offsetHeight`, then the
 * batch is greedily assigned from those real heights and re-rendered — all
 * before paint, so only the balanced result is seen.
 *
 * Two things keep the balance honest over many pages:
 *
 * - **Placeholders are not items.** The panel's loading skeletons arrive as
 *   `placeholders`, not `children`, and render below the columns. Freezing a
 *   column assignment for a skeleton (measured at skeleton height, then
 *   replaced by real content) is what makes a masonry drift, one page at a
 *   time, into "this whole page went into one column".
 * - **Identity is the React key, not the array index.** A sort, filter or
 *   refresh replaces the keys, and assignments for keys that are gone are
 *   pruned — so column heights are always recomputed from items that are
 *   actually on screen.
 */
import h from "./masonry.module.sass";
import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ScrollBodyProps } from "./data-panel";

/** Height assumed for an item that hasn't been measured yet (it always is, by
 * the time it matters — this only guards a torn-down/hidden container). */
const FALLBACK_ITEM_HEIGHT = 160;

export interface MasonryOptions {
  /** Number of columns (the maximum, when `minColumnWidth` is set). Default 2. */
  columns?: number;
  /** If set, the column count drops below `columns` when the container is too
   * narrow to give every column at least this many pixels. */
  minColumnWidth?: number;
}

interface MasonryState {
  /** Column count the current assignments were computed for. */
  columns: number;
  /** Frozen key → column. */
  assign: Map<string, number>;
  /** Last measured height per key. */
  heights: Map<string, number>;
  /** Mounted element per key, for measurement. */
  els: Map<string, HTMLElement>;
  /** Stable ref callbacks, so an item isn't detached/reattached every render. */
  refs: Map<string, (el: HTMLElement | null) => void>;
}

/**
 * A `scrollBody` component for `DataPanel` with the default two columns. For
 * anything else — a different column count, or responsive columns — build one
 * with `createMasonryScrollBody`.
 */
export function MasonryScrollBody(props: ScrollBodyProps & MasonryOptions) {
  const { children, placeholders, columns = 2, minColumnWidth } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const nCols = useColumnCount(containerRef, columns, minColumnWidth);

  const stateRef = useRef<MasonryState | null>(null);
  stateRef.current ??= {
    columns: nCols,
    assign: new Map(),
    heights: new Map(),
    els: new Map(),
    refs: new Map(),
  };
  const state = stateRef.current;
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const items = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement[];

  // Runs on every commit (no deps): measurement has to see the layout that was
  // just produced, including one caused by a resize or a card's own content
  // settling. It is cheap when nothing is unassigned, and re-renders only when
  // it actually assigns something — so there's no render loop.
  useLayoutEffect(() => {
    // A column-count change invalidates every assignment (a column may no
    // longer exist). Handled here, not in render, so render stays pure.
    if (state.columns !== nCols) {
      state.columns = nCols;
      state.assign.clear();
    }

    for (const [key, el] of state.els) state.heights.set(key, el.offsetHeight);

    const present = new Set(items.map(keyOf));
    for (const key of [...state.assign.keys()]) {
      if (!present.has(key)) state.assign.delete(key);
    }
    for (const key of [...state.heights.keys()]) {
      if (!present.has(key)) state.heights.delete(key);
    }

    const unassigned = items.filter((c) => !state.assign.has(keyOf(c)));
    if (unassigned.length === 0) return;

    // Column heights from the items already frozen into them…
    const colHeights = new Array(nCols).fill(0);
    for (const [key, col] of state.assign) {
      colHeights[col] += state.heights.get(key) ?? 0;
    }
    // …then greedily place the new batch by its just-measured real heights.
    for (const child of unassigned) {
      const key = keyOf(child);
      let col = 0;
      for (let c = 1; c < nCols; c++) {
        if (colHeights[c] < colHeights[col]) col = c;
      }
      state.assign.set(key, col);
      colHeights[col] += state.heights.get(key) ?? FALLBACK_ITEM_HEIGHT;
    }
    bump(); // move the new batch into its balanced columns, before paint
  });

  // Items without an assignment yet render in a provisional column so they
  // mount and can be measured; the layout effect above then places them.
  const stale = state.columns !== nCols;
  const columnItems: ReactNode[][] = Array.from({ length: nCols }, () => []);
  items.forEach((child, i) => {
    const key = keyOf(child);
    let assigned: number | undefined = undefined;
    if (!stale) {
      assigned = state.assign.get(key);
    }
    const col = assigned ?? i % nCols;
    columnItems[col].push(
      cloneElement(child, { ref: refFor(state, key) } as any),
    );
  });

  return h("div.data-panel-masonry-body", [
    h(
      "div.data-panel-masonry",
      { ref: containerRef },
      columnItems.map((col, c) =>
        h("div.data-panel-masonry-column", { key: c }, col),
      ),
    ),
    h.if(placeholders != null)(
      "div.data-panel-masonry-placeholders",
      placeholders,
    ),
  ]);
}

/** Build a `scrollBody` masonry component with a fixed or responsive column
 * count: `scrollBody: createMasonryScrollBody({ columns: 3 })`. */
export function createMasonryScrollBody(options: MasonryOptions = {}) {
  return function MasonryScrollBodyWithOptions(props: ScrollBodyProps) {
    return h(MasonryScrollBody, { ...options, ...props });
  };
}

function keyOf(child: ReactElement): string {
  return String(child.key);
}

/** One stable ref callback per key — a fresh closure each render would detach
 * and reattach every card on every render. */
function refFor(state: MasonryState, key: string) {
  let cb = state.refs.get(key);
  if (cb == null) {
    cb = (el: HTMLElement | null) => {
      if (el == null) {
        state.els.delete(key);
      } else {
        state.els.set(key, el);
      }
    };
    state.refs.set(key, cb);
  }
  return cb;
}

/** The effective column count: `columns`, reduced to fit `minColumnWidth`. */
function useColumnCount(
  ref: { current: HTMLElement | null },
  columns: number,
  minColumnWidth: number | undefined,
): number {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (minColumnWidth == null || el == null) return;
    const obs = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [minColumnWidth]);

  if (minColumnWidth == null || width == null) return Math.max(1, columns);
  return Math.max(1, Math.min(columns, Math.floor(width / minColumnWidth)));
}
