{createContext, Component} = require 'react'
h = require 'react-hyperscript'

SequenceStratContext = createContext({})

class SequenceStratProvider extends Component
  constructor: (props)->
    super props
    @state = {
      showTriangleBars: true
      showFloodingSurfaces: false
      sequenceStratOrder: 3
    }
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

SequenceStratConsumer = SequenceStratContext.Consumer

module.exports = {SequenceStratProvider, SequenceStratConsumer}
