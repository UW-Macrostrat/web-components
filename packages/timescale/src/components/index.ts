import h from "@macrostrat/hyper";
import { Interval, NestedInterval } from "../types";

function IntervalBox(props: { interval: Interval }) {
  const { interval: d } = props;
  return h(
    "div.interval-box",
    { key: d.oid, style: { backgroundColor: d.col } },
    h("span.interval-label", d.nam)
  );
}

function IntervalChildren({ children }) {
  if (children == null || children.length == 0) return null;
  return h(
    "div.children",
    children.map((d) => {
      return h(TimescaleBoxes, { interval: d });
    })
  );
}

function TimescaleBoxes(props: { interval: NestedInterval }) {
  const { interval } = props;
  const { children } = interval;
  return h("div.interval", [
    h(IntervalBox, { interval }),
    h(IntervalChildren, { children }),
  ]);
}

export { TimescaleBoxes };
