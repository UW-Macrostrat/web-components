import {Component, createContext} from 'react'
import h from 'react-hyperscript'

MapContext = createContext {}

class MapProvider extends Component
  render: ->
    {projection, children} = @props
    h MapContext.Provider, {value: {projection}}, children

export {MapContext, MapProvider}
