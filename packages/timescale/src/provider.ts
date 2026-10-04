import h from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import { createContext, useContext, type ReactNode } from "react";
import type { TimescaleCTX } from "./types";
import { TimescaleOrientation, IncreaseDirection } from "./types";

const TimescaleContext = createContext<TimescaleCTX | null>(null);

export interface TimescaleProviderProps extends TimescaleCTX {
  children: ReactNode;
  absoluteAgeScale?: boolean;
  increaseDirection?: IncreaseDirection;
}

function TimescaleProvider(props: TimescaleProviderProps) {
  const {
    children,
    timescale,
    ageRange,
    absoluteAgeScale,
    length,
    scale,
    increaseDirection,
    orientation,
    ...rest
  } = props;

  let ageRange2: [number, number] | null = null;
  if (ageRange != null) {
    ageRange2 = [...ageRange];
  }
  if (ageRange2 == null) {
    ageRange2 = [timescale.eag, timescale.lag];
  }

  // Domain is always [older, younger], which the zoom helpers rely on.
  ageRange2 = [Math.max(...ageRange2), Math.min(...ageRange2)];

  let length2 = length;

  if (scale != null) {
    let _domain = scale.domain() as number[];
    ageRange2 = [Math.min(..._domain), Math.max(..._domain)];
    const rng = scale.range();
    length2 = Math.abs(rng[rng.length - 1] - rng[0]);
  }

  let scale2 = scale;
  if (length && absoluteAgeScale && scale2 == null) {
    let range = [0, length];
    // Younger boxes come first in the DOM, at the top when increasing downward.
    if (
      orientation == TimescaleOrientation.VERTICAL &&
      increaseDirection == IncreaseDirection.DOWN_LEFT
    ) {
      range = [length, 0];
    }
    scale2 = scaleLinear({ range, domain: ageRange2 });
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
