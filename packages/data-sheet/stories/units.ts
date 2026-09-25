/**
 * A units fixture shared by the row-editor and data-editor stories: a unit's
 * lithologies, environments, and the positions of its base and top in time,
 * with the vocabulary pickers of `@macrostrat/data-components` as their
 * columns' surfaces. Ids are Macrostrat's own, so the pickers find their
 * colours and ages.
 */
import h from "@macrostrat/hyper";
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
import { RegionCardinality } from "@blueprintjs/table";
import type { CellDetailContext, ColumnSpec, TableAction } from "../src";

export interface Unit {
  id: number;
  unit_name: string;
  liths: UnitLithologyValue[];
  environs: EnvironmentValue[];
  base: IntervalPosition;
  top: IntervalPosition;
  max_thick: number | null;
}

/* ------------------------------------------------------------ the columns */

export function buildColumnSpec(): ColumnSpec[] {
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

/** In a cell's popover a lithology's details are stacked in the picker's
 * place (its tags, then a tag's menu, then a section), rather than popovers
 * within the popover; in the row editor and the data editor, a popover. */
function lithologyDetailsMode(ctx: CellDetailContext): "popover" | "stack" {
  if (ctx.surface === "cell") return "stack";
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

/* ------------------------------------------------------------- the actions */

/** Table actions for units, scoped as a sheet scopes them — so the same set
 * serves the sheet's toolbar and a data editor's form: "Copy as JSON" for a
 * row (in a form, the record's footer), and "Clear" for a single lithology
 * or environment cell (in a form, beside that field). */
export const unitActions: TableAction<Unit>[] = [
  {
    id: "copy-unit",
    name: "Copy as JSON",
    icon: "clipboard",
    targets: [RegionCardinality.FULL_ROWS],
    requiresEditable: false,
    appliesTo: (ctx) => ctx.rowIndex != null,
    run: (ctx) =>
      navigator.clipboard?.writeText(
        JSON.stringify(ctx.getSelectedRows()[0], null, 2),
      ),
  },
  {
    id: "clear-tags",
    name: "Clear",
    icon: "eraser",
    targets: [RegionCardinality.CELLS],
    requiresEditable: true,
    appliesTo: (ctx) =>
      ctx.cell != null && ["liths", "environs"].includes(ctx.cell.columnKey),
    run(ctx) {
      if (ctx.cell == null) return;
      ctx.onCellEdited(ctx.cell.rowIndex, ctx.cell.columnKey, []);
    },
  },
];

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
export const units: Unit[] = [
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
