import { DetritalSeries, DetritalSpectrumPlot } from ".";
import h from "@macrostrat/hyper";

function BasicPlot({ data, bandwidth, ...rest }) {
  return h(DetritalSpectrumPlot, { ...rest }, [
    h(DetritalSeries, { data, bandwidth }),
  ]);
}

export default {
  title: "Data components/Detrital zircon",
  component: BasicPlot,
  args: {
    data: [
      100, 102, 108, 502, 159, 508, 615, 1500, 1502, 1503, 1506, 1600, 2100,
      2192, 2420, 2004, 2010,
    ],
    bandwidth: 30,
  },
};

export { BasicPlot };
