import h from "@macrostrat/hyper";
import { scaleLinear } from "@vx/scale";
import { createContext, useContext } from "react";
import { TimescaleCTX, TimescaleProviderProps } from "./types";

const TimescaleContext = createContext<TimescaleCTX | null>(null);

function TimescaleProvider(
  props: React.PropsWithChildren<TimescaleProviderProps>
) {
  const { children, timescale, ageRange, scale, length, ...rest } = props;

  let innerScale = scale;
  let ageRange2 = ageRange;
  if (length && ageRange && innerScale == null) {
    innerScale = scaleLinear({
      range: [0, length],
      domain: ageRange,
    });
  }
  if (scale != null) {
    ageRange2 = scale.domain() as [number, number];
  }

  const value = {
    ...rest,
    scale: innerScale,
    timescale,
    ageRange: ageRange2,
    length,
  };
  return h(TimescaleContext.Provider, { value }, children);
}

const useTimescale = () => useContext(TimescaleContext);

export { TimescaleProvider, TimescaleContext, useTimescale };
