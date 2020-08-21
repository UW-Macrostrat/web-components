import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";

interface Interval {
  nam: string;
  oid: number;
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

  const data = { oid: 0, col: "#000000", nam: "Geologic Time", children: [] };

  return h(
    "div.timescale",
    { style: { width: 800, height: 200 } },
    l1.map((d) => {
      return h("div.interval", { key: d.oid }, h("span.interval-label", d.nam));
    })
  );
}

Timescale.defaultProps = { intervals: defaultIntervals };

export { Timescale };
