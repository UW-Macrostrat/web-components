import { CarbonIsotopesColumn, CarbonIsotopesApp } from "./index";
import h from "@macrostrat/hyper";
import { PatternProvider } from "@macrostrat/column-components/stories/base-section";
import { DarkModeProvider } from "@macrostrat/ui-components";

export default {
  title: "Column views/Carbon Isotopes",
  component: CarbonIsotopesColumn,
  decorators: [
    (Story) => {
      return h(DarkModeProvider, h(PatternProvider, h(Story)));
    },
  ],
};

export const Primary = {
  args: {
    col_id: 2192,
    project_id: 10,
    status_code: "in process",
  },
};

export const App = () => {
  return h(CarbonIsotopesApp, { project_id: 10, status_code: "in process" });
};
