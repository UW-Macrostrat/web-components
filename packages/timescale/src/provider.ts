import h from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import { createContext, useContext, type ReactNode } from "react";
import type { TimescaleCTX } from "./types";
import { TimescaleOrientation, IncreaseDirection } from "./types";

const TimescaleContext = createContext<TimescaleCTX | null>(null);

export interface TimescaleProviderProps extends TimescaleCTX {
  children: ReactNode;
  increaseDirection?: IncreaseDirection;
}

function TimescaleProvider(props: TimescaleProviderProps) {
  const {
    children,
    timescale,
    ageRange,
    length,
    scale,
    increaseDirection,
    orientation,
    ...rest
  } = props;

  let ageRange2 = null;
  if (ageRange != null) {
    ageRange2 = [...ageRange];
  }
  if (ageRange2 == null) {
    ageRange2 = [timescale.eag, timescale.lag];
  }
  if (
    orientation == TimescaleOrientation.VERTICAL &&
    increaseDirection == IncreaseDirection.DOWN_LEFT &&
    ageRange2[0] < ageRange2[1]
  ) {
    ageRange2.reverse();
  }

  let length2 = length;

  if (scale != null) {
    let _domain = scale.domain() as number[];
    ageRange2 = [Math.min(..._domain), Math.max(..._domain)];
    const rng = scale.range();
    length2 = Math.abs(rng[rng.length - 1] - rng[0]);
  }

  let scale2 = scale;
  if (length && ageRange && scale2 == null) {
    scale2 = scaleLinear({
      range: [0, length],
      domain: ageRange,
    });
  }

  const value = {
    ...rest,
    scale: scale2,
    orientation,
    timescale,
    ageRange: ageRange2,
    length: length2,
  };
  return h(TimescaleContext.Provider, { value }, children);
}

const useTimescale = () => useContext(TimescaleContext);

export { TimescaleProvider, TimescaleContext, useTimescale };
