import { Component, useState } from "react";
import update, { Spec } from "immutability-helper";

const useImmutableState = function <S>(v: S): [S, (spec: Spec<S>) => void] {
  /** useState wrapper hook that requires updating using an "immutability-helper" spec */
  const [state, setState] = useState(v);
  const updateState = function (cset: Spec<S>) {
    const newState = update(state, cset);
    return setState(newState);
  };
  return [state, updateState];
};

class StatefulComponent<Props, State> extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.updateState.bind(this);
  }
  updateState(spec: Spec<State>) {
    const newState = update(this.state, spec);
    this.setState(newState);
  }
}

export { StatefulComponent, useImmutableState };
