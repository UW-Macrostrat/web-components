/**
 * Column visibility.
 *
 * A table often carries columns that are only sometimes worth seeing:
 * generated identifiers, values derived from others, fields that matter to one
 * kind of user. `ColumnSpec.hidden` leaves such a column in the spec but out
 * of the table, so one spec serves every view and a control toggles flags on
 * it rather than maintaining several column arrays.
 *
 * The spec is memoized over the toggles, so the table re-derives its working
 * columns only when a flag actually changes.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useMemo, useState } from "react";
import { Switch } from "@blueprintjs/core";
import { DataSheet, type ColumnSpec } from "../src";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Column visibility",
  parameters: { layout: "fullscreen" },
};

export default meta;

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 30) {
  return Array.from({ length: n }, (_, i) => {
    const min = (i * 7) % 40;
    const max = min + ((i * 3) % 12);
    return {
      id: 500 + i,
      name: `Sample ${i + 1}`,
      category: categories[i % categories.length],
      min,
      max,
      mean: (min + max) / 2,
      created: `2026-0${(i % 9) + 1}-1${i % 10}`,
    };
  });
}

const data = buildData();

interface Visibility {
  identifiers: boolean;
  derived: boolean;
  metadata: boolean;
}

function buildColumnSpec(show: Visibility): ColumnSpec[] {
  return [
    {
      key: "id",
      name: "ID",
      dataType: "integer",
      width: 70,
      editable: false,
      hidden: !show.identifiers,
    },
    { key: "name", name: "Name", dataType: "string", width: 160 },
    { key: "category", name: "Category", dataType: "string", width: 130 },
    { key: "min", name: "Min", dataType: "number", width: 80 },
    { key: "max", name: "Max", dataType: "number", width: 80 },
    {
      key: "mean",
      name: "Mean",
      dataType: "number",
      width: 90,
      derived: true,
      hidden: !show.derived,
    },
    {
      key: "created",
      name: "Created",
      dataType: "string",
      width: 120,
      editable: false,
      hidden: !show.metadata,
    },
  ];
}

function VisibilityDemo() {
  const [show, setShow] = useState<Visibility>({
    identifiers: false,
    derived: true,
    metadata: false,
  });
  const columnSpec = useMemo(() => buildColumnSpec(show), [show]);

  const toggle = (key: keyof Visibility) =>
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  return h(
    "div",
    {
      style: {
        padding: "2em",
        height: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      },
    },
    [
      h("div", { style: { display: "flex", gap: "1.5em" } }, [
        h(Switch, {
          label: "Identifiers",
          checked: show.identifiers,
          onChange: () => toggle("identifiers"),
        }),
        h(Switch, {
          label: "Derived values",
          checked: show.derived,
          onChange: () => toggle("derived"),
        }),
        h(Switch, {
          label: "Record metadata",
          checked: show.metadata,
          onChange: () => toggle("metadata"),
        }),
      ]),
      h(DataSheet, {
        data,
        columnSpec,
        identity: (row) => row.id,
        editable: true,
      }),
    ],
  );
}

export const HiddenColumns: StoryObj<any> = {
  render: () => h(VisibilityDemo),
};
