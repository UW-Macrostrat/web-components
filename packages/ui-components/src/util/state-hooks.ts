import { Component, useState, useRef, useEffect } from "react";
import { isEqual } from "underscore";
import update, { Spec } from "immutability-helper";

export function useImmutableState<S>(v: S): [S, (spec: Spec<S>) => void] {
  /** useState wrapper hook that requires updating using an "immutability-helper" spec */
  const [state, setState] = useState(v);
  const updateState = function (cset: Spec<S>) {
    const newState = update(state, cset);
    return setState(newState);
  };
  return [state, updateState];
}

export function useMemoizedValue(
  obj: any,
  equalityFunction: (a: any, b: any) => boolean = isEqual
) {
  /** Hook to keep a dependency up to date using a deep equals approach */
  const ref = useRef(obj);
  if ((obj == ref.current, equalityFunction(obj, ref.current))) {
    return ref.current;
  } else {
    ref.current = obj;
    return obj;
  }
}

export class StatefulComponent<Props, State> extends Component<Props, State> {
  constructor(props: Props) {
    console.warn(
      "StatefulComponent is deprecated. Use useImmutableState instead."
    );
    super(props);
    this.updateState.bind(this);
  }
  updateState(spec: Spec<State>) {
    const newState = update(this.state, spec);
    this.setState(newState);
  }
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
