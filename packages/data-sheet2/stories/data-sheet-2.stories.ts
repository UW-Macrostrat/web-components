import h from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react";

import { DataSheetTest } from "./data-sheet-test";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet (v2)/Data sheet",
  component: DataSheetTest,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {},
};

/**
 * import { HotkeysProvider } from "@blueprintjs/core";
 * import h from "../main.module.sass";
 * import { PageBreadcrumbs } from "~/components";
 * import DataSheetTest from "@macrostrat-web/data-sheet-test";
 *
 * export function Page() {
 *   return h(
 *     HotkeysProvider,
 *     h("div.main", [
 *       h(PageBreadcrumbs),
 *       h("h1", "Data sheet"),
 *       h("p", [
 *         "This is a test of the a spreadsheet-like editor based on the ",
 *         h("code", "@blueprintjs/core"),
 *         " component. It will eventually be used as the basis for the ",
 *         h("code", "@macrostrat/data-sheet"),
 *         " library, which will underpin several important Macrostrat v2 user interfaces.",
 *       ]),
 *       h("div.data-sheet-container", h(DataSheetTest)),
 *     ])
 *   );
 * }
 */
