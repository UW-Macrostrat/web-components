import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";

interface Interval {
  nam: string;
  lvl: number;
  color: string;
  lag: number;
  eag: number;
}

interface TimescaleProps {
  intervals?: Interval[];
}

function Timescale(props: TimescaleProps) {
  /**
   * A geologic timescale component for react.
   *
   * @remarks
   * Nothing yet.
   *
   * @param intervals - Intervals
   * @param width - Width of the timescale (optional)
   *
   */
  const { intervals } = props;

  const l1 = intervals.filter((d) => d.lvl == 1);

  return h(
    "div.timescale",
    { style: { width: 800, height: 200 } },
    l1.map((d) => {
      return h("div.interval", h("span.interval-label", d.nam));
    })
  );
}

Timescale.defaultProps = { intervals: defaultIntervals };

export { Timescale };
