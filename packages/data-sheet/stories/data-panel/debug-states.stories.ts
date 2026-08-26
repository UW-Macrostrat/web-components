import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "./data-panel.stories.module.sass";
import { useMemo, useRef, useState } from "react";
import { SegmentedControl } from "@blueprintjs/core";
import {
  DataPanel,
  SelectionInteractionStyle,
  useLoadControls,
  type ItemComponentProps,
  type TableDataProvider,
} from "../../src";

/**
 * A **rendering-debug harness** for the panel's load states. A segmented control
 * in the (floating) toolbar forces the source into **loaded / loading / empty /
 * error**, so each state — skeletons, the "No results" / error `NonIdealState`,
 * and the footer — can be styled in isolation without a real backend.
 *
 * The provider is stable and reads the current mode from a ref; toggling the
 * mode bumps `refreshToken`, which resets + refetches so the new mode takes
 * effect. **Loading** hangs until the next mode switch aborts it, so the panel
 * stays in the loading state for as long as you need.
 */
type Mode = "loaded" | "loading" | "empty" | "error";

interface Row {
  id: number;
  name: string;
  detail: string;
}

const ROWS: Row[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `Item ${String(i + 1).padStart(2, "0")}`,
  detail: `Synthetic row ${i + 1}`,
}));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Card({ data }: ItemComponentProps<Row>) {
  return h("div.map-card", [
    h("div.card-header", h("span.map-name", data.name)),
    h("div.map-meta", h("span", data.detail)),
  ]);
}

/** The toolbar control that drives the harness. */
function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return h(SegmentedControl, {
    small: true,
    options: [
      { label: "Loaded", value: "loaded" },
      { label: "Loading", value: "loading" },
      { label: "Empty", value: "empty" },
      { label: "Error", value: "error" },
    ],
    value: mode,
    onValueChange: (v: string) => setMode(v as Mode),
  });
}

/** An inline footer reading the live load state, so footer styles are visible
 * (and correct) in every mode. */
function DebugFooter() {
  const { loading, loaded, total, error } = useLoadControls();
  let label = `${loaded}${total != null ? ` / ${total}` : ""} loaded`;
  if (error != null) {
    label = `error — ${error.message}`;
  } else if (loading) {
    label = "loading…";
  }
  return h(
    "div",
    {
      style: {
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--text-subtle, #738091)",
      },
    },
    label,
  );
}

function DebugPanel() {
  const [mode, setMode] = useState<Mode>("loaded");
  // The provider is stable; it reads the *current* mode from a ref, so a mode
  // switch + `refreshToken` bump re-runs `fetchData` in the new mode.
  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;

  const provider = useMemo<TableDataProvider<Row>>(
    () => ({
      identity: (r) => r.id,
      async fetchData({ offset, limit, signal }) {
        const m = modeRef.current;
        if (m === "error") {
          await sleep(250);
          throw new Error("Simulated load failure (mode = error).");
        }
        if (m === "empty") {
          await sleep(250);
          return { rows: [], totalCount: 0 };
        }
        if (m === "loading") {
          // Hang until the next mode switch aborts this request, so the panel
          // stays in the loading state indefinitely.
          await new Promise<void>((resolve) =>
            signal.addEventListener("abort", () => resolve()),
          );
          return { rows: [] };
        }
        await sleep(250);
        return {
          rows: ROWS.slice(offset, offset + limit),
          totalCount: ROWS.length,
        };
      },
    }),
    [],
  );

  return h(
    "div.data-panel-container",
    h(DataPanel<Row>, {
      provider,
      itemComponent: Card,
      pageSize: 12,
      // Toggling the mode resets + refetches so the new mode takes effect.
      refreshToken: mode,
      enableSelection: SelectionInteractionStyle.NEVER,
      // Floating toolbar + a visible footer — the combination to debug styles in.
      toolbarStyle: "floating",
      toolbar: h(ModeToggle, { mode, setMode }),
      contentFooter: h(DebugFooter),
    }),
  );
}

const meta: Meta<typeof DebugPanel> = {
  title: "Data sheet/Data panel debug",
  component: DebugPanel,
};
export default meta;

/**
 * Toggle **Loaded / Loading / Empty / Error** in the toolbar to force each
 * state. Loading stays put (skeletons + footer) until you switch away.
 */
export const LoadStates: StoryObj = {};
