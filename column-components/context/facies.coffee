import {Component, createContext} from "react"
import {StatefulComponent} from "@macrostrat/ui-components"
import h from "react-hyperscript"

FaciesContext = createContext {
  facies: [],
  onColorChanged: ->
}

class FaciesProvider extends StatefulComponent
  constructor: (props)->
    super props
    @state = {
      facies: props.initialFacies or []
      __colorMap: {}
    }

  getFaciesColor: (id)=>
    {__colorMap} = @state
    return __colorMap[id] or null

  setFaciesColor: (id,color)=>
    ix = @state.facies.findIndex (d)->d.id == id
    @updateState {facies: {[ix]: {color: {$set: color}}}}

  render: ->
    {facies} = @state
    {children, rest...} = @props
    procedures = do => {getFaciesColor, setFaciesColor} = @
    value = {
      facies
      procedures...
      rest...
    }
    h FaciesContext.Provider, {value}, children

export {FaciesContext, FaciesProvider}
