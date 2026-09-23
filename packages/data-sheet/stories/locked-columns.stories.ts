/**
 * Locked and derived columns.
 *
 * The column spec is the only authority on what may be written, and it holds
 * on every write path — typing, the fill handle, a paste, "clear", the row
 * editor — not only when a cell is clicked into. Two kinds of read-only
 * column:
 *
 * - **locked** (`editable: false`): a value that exists but this view doesn't
 *   change (an identifier).
 * - **derived** (`derived: true`): a value computed from other columns, drawn
 *   dimmed and marked ƒ in its header. It follows the values it is computed
 *   from, so the consumer recomputes it into the edit overlay.
 *
 * Try selecting a block that spans `id` and `sum` and pasting or filling
 * across it: the writable columns take the values, the others don't.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useCallback, useState } from "react";
import { Callout } from "@blueprintjs/core";
import { DataSheet, type ColumnSpec, type EditEvent } from "../src";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Locked and derived columns",
  parameters: { layout: "fullscreen" },
};

export default meta;

interface Row {
  id: number;
  name: string;
  a: number;
  b: number;
  sum: number;
}

function buildData(n = 25): Row[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 7) % 40;
    const b = (i * 13) % 25;
    return { id: 1000 + i, name: `Sample ${i + 1}`, a, b, sum: a + b };
  });
}

const baseData = buildData();

const columnSpec: ColumnSpec[] = [
  {
    key: "id",
    name: "ID",
    dataType: "integer",
    width: 80,
    // Locked: a real value this view never changes
    editable: false,
  },
  { key: "name", name: "Name", dataType: "string", width: 160 },
  { key: "a", name: "A", dataType: "number", width: 90 },
  { key: "b", name: "B", dataType: "number", width: 90 },
  {
    key: "sum",
    name: "A + B",
    dataType: "number",
    width: 100,
    // Derived: computed from A and B, never written
    derived: true,
    valueRenderer: (d) => (d == null ? "" : String(d)),
  },
];

type Edits = Map<number, Partial<Row>>;

function num(value: any): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

/** A controlled sheet whose consumer recomputes the derived column from the
 * edited values, the way a real consumer keeps a computed field honest. */
function DerivedSheet({ editable = true }: { editable?: boolean }) {
  const [edits, setEdits] = useState<Edits>(new Map());

  const onEdit = useCallback((event: EditEvent<Row>) => {
    if (event.type === "resetChanges") {
      setEdits(new Map());
      return;
    }
    if (event.type !== "setCells") return;
    setEdits((prev) => {
      const next = new Map(prev);
      for (const { row, column, value } of event.cells) {
        if (row == null) continue;
        const current = { ...(next.get(row.id) ?? {}) };
        (current as any)[column] = value;
        // Recompute the derived column from the edited row
        const merged = { ...row, ...current };
        current.sum = num(merged.a) + num(merged.b);
        next.set(row.id, current);
      }
      return next;
    });
  }, []);

  const deriveOverlay = useCallback(
    (rows: Row[]) => ({
      updatedData: rows.map((row) =>
        row == null ? undefined : edits.get(row.id),
      ),
      rowStatus: [],
    }),
    [edits],
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%" } },
    [
      h(
        Callout,
        { icon: "lock", style: { marginBottom: "0.5em" } },
        "ID is locked; A + B is derived. Paste or fill a block across them and only A, B and Name change.",
      ),
      h(DataSheet<Row>, {
        data: baseData,
        columnSpec,
        editable,
        identity: (row) => row.id,
        deriveOverlay,
        onEdit,
      }),
    ],
  );
}

function Wrapper(props) {
  return h(
    "div",
    { style: { padding: "2em", height: "100vh", boxSizing: "border-box" } },
    h(DerivedSheet, props),
  );
}

export const LockedAndDerived: StoryObj<any> = {
  render: () => h(Wrapper),
};

/** The whole sheet as a viewer: nothing is writable, and the derived column
 * still reads as derived. */
export const ReadOnlySheet: StoryObj<any> = {
  render: () => h(Wrapper, { editable: false }),
};
