import {Component, createContext} from "react"
import h from "react-hyperscript"
import T from "prop-types"

ColumnContext = createContext {}

class ColumnProvider extends Component
  @propTypes: {
    divisions: T.arrayOf(T.object)
    scale: T.func.isRequired
  }
  render: ->
    {children, rest...} = @props
    value = {rest...}
    h ColumnContext.Provider, {value}, children

export {ColumnContext, ColumnProvider}
