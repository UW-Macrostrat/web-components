import h from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import { createContext, useContext } from "react";
import { TimescaleCTX } from "./types";

const TimescaleContext = createContext<TimescaleCTX | null>(null);

function TimescaleProvider(props: React.PropsWithChildren<TimescaleCTX>) {
  const { children, timescale, ageRange, length, scale, ...rest } = props;

  let scale2 = scale;
  if (length && ageRange && scale2 == null) {
    scale2 = scaleLinear({
      range: [0, length],
      domain: ageRange,
    });
  }

  const value = { ...rest, scale: scale2, timescale, ageRange, length };
  return h(TimescaleContext.Provider, { value }, children);
}

const useTimescale = () => useContext(TimescaleContext);

export { TimescaleProvider, TimescaleContext, useTimescale };
