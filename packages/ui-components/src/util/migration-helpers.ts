import { useEffect } from "react";
import { usePrevious } from "./state-hooks";

export function useComponentDidUpdate<
  Props extends object,
  State extends object,
>(
  componentUpdater: (prevProps: Props, prevState: State) => void,
  props = {} as Props,
  state = {} as State,
) {
  /** Run a function every time props and state changes.
   * Analogous to componentDidUpdate in a class component. This is useful for incrementally
   * transitioning from class to functional React components. */
  const prevProps = usePrevious<Props>(props);
  const prevState = usePrevious<State>(state);
  useEffect(
    () =>
      console.warn(
        "The useComponentDidUpdate hook performs poorly and is only meant " +
          "to ease the transition to functional components. " +
          "Please transition to direct use of useEffect to remove this warning.",
      ),
    [],
  );
  useEffect(() => {
    if (prevProps == null) return;
    componentUpdater(prevProps, prevState ?? ({} as State));
  }, [...Object.values(props ?? {}), ...Object.values(state ?? {})]);
}

export function useWarning(message: string, isEnabled: boolean = true) {
  /** This hook is used to warn developers for migration purposes */
  useEffect(() => {
    if (isEnabled) console.warn(message);
  }, [message, isEnabled]);
}

export function useDeprecationWarning(
  name: string = "This component",
  replacedBy?: string,
) {
  /** This hook is used to warn developers for migration purposes */
  let msg = `${name} is deprecated and will be removed in a future release`;
  if (replacedBy) {
    msg += `. Please use ${replacedBy} instead`;
  }
  useWarning(msg);
}
