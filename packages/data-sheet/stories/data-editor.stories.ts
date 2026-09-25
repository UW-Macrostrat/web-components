/**
 * Data editor.
 *
 * One record's fields as a form, from a data spec — the same field semantics
 * as a sheet's column spec (the units sheet's spec is used here unchanged):
 * the field's `valueRenderer` draws it, its `cellDetail` edits it, and
 * `validate` / `required` flag it. `DataEditor` keeps its own pending edits,
 * with Reset and Save in its footer (Save waits for there to be edits and for
 * no field to be an error).
 *
 * Its actions are the units sheet's table actions, scoped to the form: "Copy
 * as JSON" (a row action) sits in the footer, and "Clear" (a single-cell
 * action for the lithology and environment columns) beside those fields.
 *
 * It stands alone, so it has no selected field; the sheet's row editor is the
 * same form over the sheet's selected rows.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import classNames from "classnames";
import {
  createLocalProvider,
  DataEditor,
  DataPanel,
  type ItemComponentProps,
  SelectedDataEditor,
  type TableDataProvider,
} from "../src";
import { buildColumnSpec, type Unit, unitActions, units } from "./units";
import h from "./data-editor.stories.module.sass";

const meta: Meta<any> = {
  title: "Data sheet/Data editor",
  parameters: { layout: "padded" },
};

export default meta;

/** A unit's fields as a standalone form: edit, Reset, Save. The saved record
 * comes back as the editor's `data`, so it starts clean again. */
export const Standalone: StoryObj<any> = {
  render: () => h(StandaloneDemo),
};

/** A scrolling card list (`DataPanel`) with the editor in its sidebar, as a
 * sheet has its row editor: select a card and `SelectedDataEditor` edits it,
 * saving through the panel's provider (`rowEditing.saveRows`), which
 * refreshes the list. */
export const InDataPanel: StoryObj<any> = {
  parameters: { layout: "fullscreen" },
  render: () => h(PanelDemo),
};

/* ------------------------------------------------------------- standalone */

function StandaloneDemo() {
  const dataSpec = useMemo(() => editorSpec(), []);
  const [unit, setUnit] = useState<Unit>(units[1]);
  const [saves, setSaves] = useState(0);
  return h("div.standalone", [
    h(DataEditor<Unit>, {
      dataSpec,
      data: unit,
      panel: true,
      title: unit.unit_name,
      actions: unitActions,
      async onSave(value) {
        await wait(400);
        setUnit(value);
        setSaves((n) => n + 1);
      },
    }),
    h("pre.state", `Saved ${saves} times\n${JSON.stringify(unit, null, 2)}`),
  ]);
}

/* ----------------------------------------------------------- in a panel */

function PanelDemo() {
  const provider = useMemo(() => editableUnits(), []);
  const columnSpec = useMemo(() => editorSpec(), []);
  return h(
    "div.panel-story",
    h(DataPanel<Unit>, {
      provider,
      columnSpec,
      itemComponent: UnitCard,
      itemLabel: "unit",
      name: "Units",
      actions: unitActions,
      sidebar: h("div.sidebar-editor", h(SelectedDataEditor<Unit>)),
    }),
  );
}

/** A unit as a card: a compact, read-only data editor. A click selects it,
 * and the sidebar edits it. */
function UnitCard({ data, selected, onSelect }: ItemComponentProps<Unit>) {
  const dataSpec = useMemo(() => editorSpec(), []);
  return h(
    "div.unit-card",
    { className: classNames({ selected }), onClick: onSelect },
    [
      h("div.unit-card-header", data.unit_name),
      h(DataEditor<Unit>, {
        dataSpec: dataSpec.filter((d) => d.key !== "unit_name"),
        data,
        editable: false,
        hideEmpty: true,
        inline: true,
      }),
    ],
  );
}

/* -------------------------------------------------------------- helpers */

/** The units sheet's column spec as a data spec: every field but the id. */
function editorSpec() {
  return buildColumnSpec().filter((field) => field.key !== "id");
}

/** The units fixture as a provider that persists edits in memory. */
function editableUnits(): TableDataProvider<Unit> {
  const rows = units.map((d) => ({ ...d }));
  return {
    ...createLocalProvider<Unit>(rows, { identity: (d) => d.id }),
    async saveRows(updated) {
      for (const row of updated) {
        const i = rows.findIndex((d) => d.id === row.id);
        if (i >= 0) rows[i] = row;
      }
    },
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
