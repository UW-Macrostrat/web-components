import {Component, createContext} from "react"
import h from "react-hyperscript"
import T from "prop-types"
import {query} from "app/sections/db"

ColumnSurfacesContext = createContext {}

class ColumnSurfacesProvider extends Component
  ###
  # Makes sure divisions are defined for sections
  ###
  @propTypes: {
    id: T.string
    divisions: T.arrayOf(T.object)
  }
  constructor: (props)->
    super props
    {divisions} = @props
    if not divisions?
      divisions = []
      @updateDivisions()
    @state = {divisions}

  updateDivisions: =>
    {id} = @props
    divisions = await query 'lithology', [id]
    @setState {divisions}

  render: ->
    {children} = @props
    {divisions} = @state
    {updateDivisions} = @
    value = {divisions, updateDivisions}
    h ColumnSurfacesContext.Provider, {value}, children

export {ColumnSurfacesContext, ColumnSurfacesProvider}
