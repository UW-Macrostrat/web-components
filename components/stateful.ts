import {Component} from 'react'
import update, {Spec} from 'immutability-helper'

class StatefulComponent<Props,State> extends Component<Props,State> {
  constructor(props: Props){
    super(props)
    this.updateState.bind(this)
  }
  updateState(spec: Spec<State>) {
    const newState = update(this.state, spec)
    this.setState(newState)
  }
}

export {StatefulComponent}
