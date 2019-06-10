import {Component, createContext} from "react"
import h from "react-hyperscript"

ColumnContext = createContext {}

class ColumnProvider extends Component
  render: ->
    {children, rest...} = @props
    value = {rest...}
    h ColumnContext.Provider, {value}, children

export {ColumnContext, ColumnProvider}
