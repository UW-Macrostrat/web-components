import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  Profiler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RenderMode } from "@blueprintjs/table";
import { Checkbox, HTMLSelect, Icon, Tag } from "@blueprintjs/core";
import { DataSheet } from "../src";
import type { ColumnSpec } from "../src";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Performance",
  parameters: { layout: "fullscreen" },
};

export default meta;

/**
 * **Render-performance harness.** A wide, tall table with knobs to isolate the
 * cause of scroll jank / "tearing" — especially horizontal scroll:
 *
 * - **Columns / rows** — width drives horizontal scrolling.
 * - **Cell content** — plain text vs. inline-styled vs. a heavy per-cell
 *   component (Tag + Icon).
 * - **Render mode** — Blueprint `NONE` (synchronous) vs. `BATCH_ON_UPDATE`.
 * - **Final-column tint** — injects the ingestion page's `:has([data-column-key])`
 *   CSS, to test whether that selector is the paint cost.
 *
 * Readouts: React **commit time** (from `<Profiler>`), **cell renders/sec**
 * (a counter bumped in each cell's value renderer), and a **frame-rate meter**.
 * If scrolling tears while commit-time and renders/sec stay ~0, the cost is
 * browser paint (CSS / Blueprint quadrant sync), not React re-rendering.
 *
 * To see the read-only-cell memoization: with `heavy` cells, click around to
 * move focus between cells and watch **cell renders/sec** — moving focus
 * re-renders only the two cells involved, not every visible cell (previously it
 * re-rendered them all, which was very visible with heavy cell components).
 */

// Sampled by the meters on an interval — NEVER via setState inside a hot path
// (e.g. `Profiler.onRender`), which would feed back into another commit and
// loop. `CELL_RENDERS` is bumped per cell render; `LAST_COMMIT_MS` is the most
// recent React commit duration.
let CELL_RENDERS = 0;
let LAST_COMMIT_MS = 0;

type CellKind = "text" | "styled" | "heavy";

function makeData(rows: number, cols: number) {
  const keys = Array.from({ length: cols }, (_, i) => `col_${i}`);
  return Array.from({ length: rows }, (_, r) => {
    const row: any = { id: r + 1 };
    for (let c = 0; c < keys.length; c++) row[keys[c]] = `r${r}·c${c}`;
    return row;
  });
}

function buildColumns(cols: number, kind: CellKind): ColumnSpec[] {
  return Array.from({ length: cols }, (_, c) => {
    const key = `col_${c}`;
    const base: ColumnSpec = { name: `Column ${c}`, key, width: 130 };
    if (kind === "text") {
      base.valueRenderer = (v: any) => {
        CELL_RENDERS++;
        return v;
      };
    } else if (kind === "styled") {
      base.style = { color: c % 2 ? "#2965cc" : undefined };
      base.valueRenderer = (v: any) => {
        CELL_RENDERS++;
        return h(
          "span",
          { style: { fontVariantNumeric: "tabular-nums", padding: "0 2px" } },
          v,
        );
      };
    } else {
      // Heavy: a component-per-cell (Tag + Icon) — stand-in for interval cells,
      // status pills, etc.
      base.valueRenderer = (v: any) => {
        CELL_RENDERS++;
        return h(Tag, { minimal: true, icon: h(Icon, { icon: "cube", size: 10 }) }, v);
      };
    }
    return base;
  });
}

/** Frame-rate meter: a rAF loop measuring inter-frame delta. Scroll and watch
 * it drop when the table can't keep up with paint. */
function FrameMeter() {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      frames++;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const intent = fps >= 50 ? "success" : fps >= 30 ? "warning" : "danger";
  return h(Tag, { intent, minimal: true }, `${fps} fps`);
}

/** Cell renders per second, sampled from the module counter. */
function CellRenderMeter() {
  const [rate, setRate] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      setRate(CELL_RENDERS - prev.current);
      prev.current = CELL_RENDERS;
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return h(Tag, { minimal: true }, `${rate} cell renders/s`);
}

/** Last React commit duration, sampled from the module var (populated by the
 * `<Profiler>` without touching React state, so it can't loop). */
function CommitMeter() {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMs(LAST_COMMIT_MS), 500);
    return () => clearInterval(id);
  }, []);
  return h(Tag, { minimal: true }, `${ms.toFixed(1)} ms commit`);
}

const ROW_PRESETS = [100, 1000, 5000, 20000];
const COL_PRESETS = [10, 40, 80, 150];

function PerfHarness() {
  const [cols, setCols] = useState(40);
  const [rows, setRows] = useState(1000);
  const [kind, setKind] = useState<CellKind>("styled");
  const [syncRender, setSyncRender] = useState(true);
  const [tint, setTint] = useState(false);

  const data = useMemo(() => makeData(rows, cols), [rows, cols]);
  const columnSpec = useMemo(() => buildColumns(cols, kind), [cols, kind]);

  // Inject the ingestion-style final-column tint (a `:has()` selector) to test
  // whether it's the horizontal-scroll paint cost.
  const tintCSS = useMemo(() => {
    if (!tint) return "";
    const keys = Array.from({ length: cols }, (_, i) => `col_${i}`).filter(
      (_, i) => i % 3 === 0,
    );
    const sel = keys
      .map((k) => `.bp6-table-header:has([data-column-key="${k}"])`)
      .join(",");
    return `${sel}{background-color:rgba(45,114,210,0.12)}`;
  }, [tint, cols]);

  return h(
    "div",
    {
      style: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "1em",
        boxSizing: "border-box",
        gap: "0.5em",
      },
    },
    [
      tintCSS !== "" ? h("style", tintCSS) : null,
      h("div.perf-controls", { style: controlBarStyle }, [
        h(LabeledSelect, {
          label: "Columns",
          value: cols,
          options: COL_PRESETS,
          onChange: setCols,
        }),
        h(LabeledSelect, {
          label: "Rows",
          value: rows,
          options: ROW_PRESETS,
          onChange: setRows,
        }),
        h("label", { style: fieldStyle }, [
          "Cells ",
          h(HTMLSelect, {
            value: kind,
            options: ["text", "styled", "heavy"],
            onChange: (e: any) => setKind(e.currentTarget.value),
          }),
        ]),
        h(Checkbox, {
          checked: syncRender,
          label: "Synchronous render (NONE)",
          style: { marginBottom: 0 },
          onChange: (e: any) => setSyncRender(e.currentTarget.checked),
        }),
        h(Checkbox, {
          checked: tint,
          label: "Final-column tint (:has)",
          style: { marginBottom: 0 },
          onChange: (e: any) => setTint(e.currentTarget.checked),
        }),
        h("div", { style: { flex: 1 } }),
        h(CommitMeter),
        h(CellRenderMeter),
        h(FrameMeter),
      ]),
      h(
        "div",
        { style: { flex: 1, minHeight: 0 } },
        h(
          Profiler,
          {
            id: "perf-table",
            // Write to a module var only — no React state in a commit callback.
            onRender: (_id: string, _phase: string, actualDuration: number) => {
              LAST_COMMIT_MS = actualDuration;
            },
          },
          h(DataSheet, {
            data,
            columnSpec,
            editable: true,
            enableColumnReordering: true,
            renderMode: syncRender ? RenderMode.NONE : RenderMode.BATCH_ON_UPDATE,
          }),
        ),
      ),
    ],
  );
}

const controlBarStyle = {
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};
const fieldStyle = { display: "flex", alignItems: "center", gap: "4px" };

function LabeledSelect({ label, value, options, onChange }: any) {
  return h("label", { style: fieldStyle }, [
    `${label} `,
    h(HTMLSelect, {
      value,
      options: options.map((n: number) => ({ value: n, label: String(n) })),
      onChange: (e: any) => onChange(Number(e.currentTarget.value)),
    }),
  ]);
}

export const RenderPerformance: StoryObj = {
  render: () => h(PerfHarness),
};
