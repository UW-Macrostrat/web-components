import h from "@macrostrat/hyper";
import { scaleLinear } from "@vx/scale";
import { useContext, createContext } from "react";

const TimescaleContext = createContext<TimescaleCTX>({
  selectedInterval: null,
  parentMap: new Map(),
});

function TimescaleProvider(props: React.PropsWithChildren<TimescaleCTX>) {
  const { children, ...rest } = props;
  const value = { ...rest };
  return h(TimescaleContext.Provider, { value }, children);
}

export { TimescaleProvider, TimescaleContext };
