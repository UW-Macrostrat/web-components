import h from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import { createContext, useContext } from "react";
import { TimescaleCTX } from "./types";

const TimescaleContext = createContext<TimescaleCTX | null>(null);

function TimescaleProvider(
  props: React.PropsWithChildren<Omit<TimescaleCTX, "scale">>,
) {
  const { children, timescale, ageRange, length, ...rest } = props;

  let scale = null;
  if (length && ageRange) {
    scale = scaleLinear({
      range: [0, length],
      domain: ageRange,
    });
  }

  const value = { ...rest, scale, timescale, ageRange, length };
  return h(TimescaleContext.Provider, { value }, children);
}

const useTimescale = () => useContext(TimescaleContext);

export { TimescaleProvider, TimescaleContext, useTimescale };
