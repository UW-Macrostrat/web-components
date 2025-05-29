import {
  CarbonIsotopesApp,
  IsotopesColumn,
  MacrostratDataProvider,
  MeasurementDataProvider,
} from "../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "./standalone-column";

function StableIsotopesOverlay(props) {
  return h(MeasurementDataProvider, { col_id: props.columnID }, [
    h(IsotopesColumn, {
      parameter: "D13C",
      label: "δ¹³C",
      width: 100,
      nTicks: 4,
      showAxis: true,
    }),
    h(IsotopesColumn, {
      parameter: "D18O",
      label: "δ¹⁸O",
      color: "red",
      domain: [-40, 0],
      width: 100,
      nTicks: 4,
      showAxis: true,
    }),
  ]);
}

function CarbonIsotopesColumn(props) {
  const { id, children, ...rest } = props;

  return h(
    MacrostratDataProvider,
    h(StandaloneColumn, {
      id,
      ...rest,
      children: [h(StableIsotopesOverlay, { columnID: id }), children],
    })
  );
}

export default {
  title: "Column views/Carbon Isotopes",
  component: CarbonIsotopesColumn,
};

export const Primary = {
  args: {
    id: 2192,
    project_id: 10,
    inProcess: true,
    showTimescale: false,
    showLabelColumn: false,
  },
};

// export const App = () => {
//   return h(CarbonIsotopesApp, { project_id: 10, status_code: "in process" });
// };
