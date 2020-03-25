import { Component } from 'react';
import { Spec } from 'immutability-helper';
declare class StatefulComponent<Props, State> extends Component<Props, State> {
    constructor(props: Props);
    updateState(spec: Spec<State>): void;
}
export { StatefulComponent };
