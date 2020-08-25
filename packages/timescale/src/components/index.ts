import h from "@macrostrat/hyper";
import { Interval, NestedInterval } from "../types";
import { useTimescale } from "../provider";

function IntervalBox(props: { interval: Interval; showLabel?: boolean }) {
  const { interval: d, showLabel = true } = props;
  return h(
    "div.interval-box",
    { key: d.oid, style: { backgroundColor: d.col } },
    h.if(showLabel)("span.interval-label", d.nam)
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
  const { scale } = useTimescale();
  const { eag, lag } = interval;
  const length = scale ? scale(eag) - scale(lag) : null;

  const { children, nam: name } = interval;
  return h("div.interval", { className: name, style: { height: length } }, [
    h(IntervalBox, { interval }),
    h(IntervalChildren, { children }),
  ]);
}

export { TimescaleBoxes };
