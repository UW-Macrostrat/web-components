import {Component, useState} from 'react'
import update from 'immutability-helper'

useImmutableState = (v)->
  [state, setState] = useState(v)
  updateState = (cset)->
    newState = update(state,cset)
    setState(newState)
  return [state, updateState]

class StatefulComponent extends Component
  updateState: (spec)=>
    newState = update @state, spec
    @setState newState

export {StatefulComponent, useImmutableState}
