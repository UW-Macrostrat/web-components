{createContext, Component} = require 'react'
h = require 'react-hyperscript'
update = require 'immutability-helper'

LocalStorage = require './storage'

SequenceStratContext = createContext({})

class SequenceStratProvider extends Component
  constructor: (props)->
    super props
    @state = {
      showTriangleBars: true
      showFloodingSurfaces: false
      sequenceStratOrder: 3
    }

    @storage = new LocalStorage 'sequence-strat'
    v = @storage.get()
    return unless v?
    @state = update @state, {$merge: v}

  render: ->
    actions = {
      updateState: (val)=>@setState(val)
      toggleBooleanState: (key)=> =>
        obj = {}
        obj[key] = !@state[key]
        @setState(obj)
    }
    value = {@state..., actions}
    h SequenceStratContext.Provider, {value}, @props.children

  componentDidUpdate: (prevProps, prevState)->
    return if prevState == @state
    @storage.set @state

SequenceStratConsumer = SequenceStratContext.Consumer

module.exports = {SequenceStratProvider, SequenceStratConsumer}
