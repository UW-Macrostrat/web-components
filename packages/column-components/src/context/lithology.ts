import { createContext } from "react";
import h from "@macrostrat/hyper";

export const LithologyContext = createContext({ lithologies: [] });

export function LithologyProvider(props) {
  const { lithologies, children } = props;
  // @ts-ignore
  return h(LithologyContext.Provider, { value: { lithologies } }, children);
}
