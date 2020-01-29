import {Component} from 'react'
import update from 'immutability-helper'

class StatefulComponent extends Component {
  constructor(props){
    super(props)
    this.updateState.bind(this)
  }
  updateState(spec) {
    const newState = update(this.state, spec)
    this.setState(newState)
  }
}

export {StatefulComponent}
