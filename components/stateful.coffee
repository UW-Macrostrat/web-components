import {Component} from 'react'
import update from 'immutability-helper'

class StatefulComponent extends Component
  updateState: (spec)=>
    newState = update @state, spec
    @setState newState

export {StatefulComponent}
