import h from "@macrostrat/hyper";
import { scaleLinear } from "@vx/scale";
import { createContext } from "react";
import { TimescaleCTX } from "./types";

const TimescaleContext = createContext<TimescaleCTX | null>(null);

function TimescaleProvider(
  props: React.PropsWithChildren<Omit<TimescaleCTX, "scale">>
) {
  const { children, timescale, ...rest } = props;

  const scale = scaleLinear({
    range: [0, 500],
    domain: [0, 4000],
  });

  const value = { ...rest, scale, timescale };
  return h(TimescaleContext.Provider, { value }, children);
}

export { TimescaleProvider, TimescaleContext };
