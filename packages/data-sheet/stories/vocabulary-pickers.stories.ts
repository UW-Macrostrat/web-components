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
  DataSheetDensity,
  DataSheetProvider,
  DataSheetRenderer,
  DataViewRendererType,
  SelectedRowEditor,
  showRowEditorAction,
  splitDataProviderProps,
} from "../src";
import { buildColumnSpec, type Unit, unitActions, units } from "./units";
import styles from "./row-editor.stories.module.sass";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper.styled(styles);

const meta: Meta<any> = {
  title: "Data sheet/Row editor/Vocabulary pickers",
  parameters: { layout: "fullscreen" },
};

export default meta;

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
    actions: [showRowEditorAction, ...unitActions],
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
