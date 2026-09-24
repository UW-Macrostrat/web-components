/**
 * The vocabulary pickers of `@macrostrat/data-components` as the surfaces of
 * a sheet's columns: a unit's lithologies, environments, and the positions of
 * its base and top in time.
 *
 * Each picker is one column's `cellDetail` — the same function draws the
 * grid's popover editor and the row editor's field — and, read-only, its
 * `valueRenderer`, so a cell shows the same tags the editor does. The
 * lithology column resolves its proportions (`comp_prop`) on every change.
 *
 * Every picker column declares `multiCell`. Over several selected units the
 * lithology and environment pickers stand for all of them at once, through
 * the detail context's `cells` and `onChangeCells`: what the units hold
 * between them is shown, faded where only some hold it, and a partial tag's
 * header offers "Apply to all". Adding or removing a tag changes each unit's
 * own list; the rest of each list stays. The interval columns set one
 * position on every selected unit.
 *
 * The sheet is set up for a row editor beside it: a click selects (feeding
 * the editor) and a second click opens a cell's picker
 * (`cellInteraction: "second-click"`), below the cell since pickers are wide
 * (`detailPlacement`). In a cell a lithology's details open inline, so the
 * cell's popover doesn't nest popovers of its own; in the row editor, where
 * there is room, they open in a popover (`ctx.surface`). The toolbar's
 * Row editor toggle shows and hides the panel.
 *
 * Vocabularies come from the pickers' default Macrostrat data store.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useMemo } from "react";
import {
  EnvironmentPicker,
  type EnvironmentValue,
  type IntervalPosition,
  IntervalPositionEditor,
  LithologyPicker,
  macrostratProportionTerms,
  resolveLithologyProportions,
  type UnitLithologyValue,
} from "@macrostrat/data-components";
import {
  type CellDetailContext,
  type ColumnSpec,
  DataSheetDensity,
  DataSheetProvider,
  DataSheetRenderer,
  DataViewRendererType,
  SelectedRowEditor,
  showRowEditorAction,
  splitDataProviderProps,
} from "../src";
import styles from "./row-editor.stories.module.sass";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper.styled(styles);

const meta: Meta<any> = {
  title: "Data sheet/Row editor/Vocabulary pickers",
  parameters: { layout: "fullscreen" },
};

export default meta;

interface Unit {
  id: number;
  unit_name: string;
  liths: UnitLithologyValue[];
  environs: EnvironmentValue[];
  base: IntervalPosition;
  top: IntervalPosition;
  max_thick: number | null;
}

/** Selecting a unit edits it in the panel; a second click on a lithology or
 * environment cell opens the same picker below it. */
export const UnitsSheet: StoryObj<any> = {
  render: () => h(UnitsSheetDemo),
};

/** The same sheet read-only: the row editor becomes a row viewer, and every
 * picker draws its value without editing affordances. */
export const UnitsViewer: StoryObj<any> = {
  render: () => h(UnitsSheetDemo, { editable: false }),
};

function UnitsSheetDemo({ editable = true }: { editable?: boolean }) {
  const columnSpec = useMemo(() => buildColumnSpec(), []);

  const [providerProps, rendererProps] = splitDataProviderProps<Unit>({
    data: units,
    columnSpec,
    editable,
    itemLabel: "unit",
    identity: (row) => row.id,
    viewType: DataViewRendererType.TABLE,
    density: DataSheetDensity.MEDIUM,
    cellInteraction: "second-click",
    actions: [showRowEditorAction],
  } as any);

  return h("div.story", [
    h(DataSheetProvider<Unit>, providerProps as any, [
      h("div.split", [
        h("div.grid-pane", h(DataSheetRenderer<Unit>, rendererProps as any)),
        h("div.panel", h(SelectedRowEditor)),
      ]),
    ]),
  ]);
}

/* ------------------------------------------------------------ the columns */

function buildColumnSpec(): ColumnSpec[] {
  return [
    { key: "id", name: "ID", dataType: "integer", width: 60, editable: false },
    {
      key: "unit_name",
      name: "Unit",
      dataType: "string",
      width: 150,
      required: true,
    },
    {
      key: "liths",
      name: "Lithology",
      dataType: "array",
      width: 280,
      multiCell: true,
      detailPlacement: "bottom-start",
      valueRenderer: (value) => h(LithologyPicker, { value }),
      cellDetail: (ctx) =>
        h(LithologyPicker, {
          ...tagListProps(ctx),
          proportions: { terms: macrostratProportionTerms },
          resolveProportions: true,
          detailsMode: lithologyDetailsMode(ctx),
        }),
    },
    {
      key: "environs",
      name: "Environment",
      dataType: "array",
      width: 200,
      multiCell: true,
      detailPlacement: "bottom-start",
      valueRenderer: (value) => h(EnvironmentPicker, { value }),
      cellDetail: (ctx) => h(EnvironmentPicker, tagListProps(ctx)),
    },
    intervalColumn("base", "Base"),
    intervalColumn("top", "Top", 1),
    {
      key: "max_thick",
      name: "Thickness (m)",
      dataType: "number",
      width: 110,
    },
  ];
}

/** A position in time: an interval tag, with its position in the prefix. A
 * position added here starts at the interval's base (0) for a unit's base,
 * and at its top (1) for its top. */
function intervalColumn(
  key: "base" | "top",
  name: string,
  defaultProportion = 0,
): ColumnSpec {
  return {
    key,
    name,
    dataType: "object",
    width: 170,
    multiCell: true,
    detailPlacement: "bottom-start",
    valueRenderer: (value) =>
      h(IntervalPositionEditor, { value, showAge: false }),
    cellDetail: (ctx) =>
      h(IntervalPositionEditor, {
        value: ctx.value,
        onChange: editableChange(ctx),
        defaultProportion,
        timescaleChoice: true,
      }),
  };
}

/** In a cell's popover a lithology's details open inline, rather than as a
 * popover within the popover; in the row editor, in a popover. */
function lithologyDetailsMode(ctx: CellDetailContext): "popover" | "inline" {
  if (ctx.surface === "cell") return "inline";
  return "popover";
}

/** A tag-list picker's value: one cell's list, or — over several rows — each
 * row's, changed row by row. */
function tagListProps(ctx: CellDetailContext) {
  if (ctx.cells != null) {
    let onChangeValues: ((values: any[][]) => void) | undefined;
    if (ctx.editable) onChangeValues = ctx.onChangeCells;
    return {
      value: null,
      values: ctx.cells.map((c) => c.value ?? []),
      onChangeValues,
    };
  }
  return { value: ctx.value ?? [], onChange: editableChange(ctx) };
}

/** A picker edits only when the cell does; otherwise it is a viewer. */
function editableChange(ctx: CellDetailContext) {
  if (!ctx.editable) return undefined;
  return (value: any) => ctx.onChange(value);
}

/* ---------------------------------------------------------------- the data */

const [major, minor] = macrostratProportionTerms;

function lith(lith_id: number, name: string, extra = {}): UnitLithologyValue {
  return { lith_id, name, ...extra };
}

function env(environ_id: number, name: string): EnvironmentValue {
  return { environ_id, name };
}

function at(int_id: number, int_name: string, prop: number | null = null) {
  return { int_id, int_name, prop };
}

// Ids are Macrostrat's own, so the pickers find their colours and ages
const units: Unit[] = [
  {
    id: 1,
    unit_name: "Basal conglomerate",
    liths: resolveLithologyProportions([
      lith(14, "conglomerate", { prop_term: major }),
      lith(10, "sandstone", { prop_term: minor, atts: ["coarse"] }),
    ]),
    environs: [env(25, "shoreface")],
    base: at(122, "Cambrian", 0.6),
    top: at(122, "Cambrian", 0.75),
    max_thick: 12,
  },
  {
    id: 2,
    unit_name: "Lower sandstone",
    liths: resolveLithologyProportions([
      lith(10, "sandstone", { prop: 0.8 }),
      lith(8, "shale", { prop: 0.2 }),
    ]),
    environs: [env(25, "shoreface"), env(24, "foreshore")],
    base: at(122, "Cambrian", 0.75),
    top: at(122, "Cambrian", 1),
    max_thick: 85,
  },
  {
    id: 3,
    unit_name: "Shale member",
    liths: resolveLithologyProportions([
      lith(8, "shale", { prop_term: major }),
      lith(9, "siltstone", { prop_term: minor }),
    ]),
    environs: [env(17, "offshore shelf")],
    base: at(112, "Ordovician"),
    top: at(112, "Ordovician"),
    max_thick: 140,
  },
  {
    id: 4,
    unit_name: "Reef limestone",
    liths: resolveLithologyProportions([lith(30, "limestone")]),
    environs: [env(6, "reef")],
    base: at(111, "Llandovery", 0.4),
    top: at(109, "Wenlock", 0.5),
    max_thick: 60,
  },
  {
    id: 5,
    unit_name: "Dolomite",
    liths: resolveLithologyProportions([
      lith(31, "dolomite", { prop_term: major }),
      lith(34, "evaporite", { prop_term: minor }),
    ]),
    environs: [env(1, "peritidal")],
    base: at(107, "Pridoli"),
    top: at(101, "Early Devonian", 0.3),
    max_thick: 45,
  },
  {
    id: 6,
    unit_name: "Upper shale",
    liths: resolveLithologyProportions([lith(8, "shale")]),
    environs: [env(20, "basinal")],
    base: at(95, "Late Devonian"),
    top: at(95, "Late Devonian", 1),
    max_thick: null,
  },
  {
    id: 7,
    unit_name: "Deltaic sandstone",
    liths: resolveLithologyProportions([
      lith(10, "sandstone", { prop_term: major }),
      lith(9, "siltstone", { prop_term: minor }),
      lith(8, "shale", { prop_term: minor }),
    ]),
    environs: [env(30, "delta plain"), env(32, "delta front")],
    base: at(90, "Mississippian", 0.5),
    top: at(85, "Pennsylvanian", 0.2),
    max_thick: 210,
  },
  {
    id: 8,
    unit_name: "Cap limestone",
    liths: [],
    environs: [],
    base: at(85, "Pennsylvanian", 0.2),
    top: at(null as any, null as any),
    max_thick: 8,
  },
];
