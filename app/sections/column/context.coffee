import {scaleLinear, scaleOrdinal} from "d3"
import {Component, createContext} from "react"
import h from "react-hyperscript"
import T from "prop-types"

ColumnContext = createContext {}

class ColumnProvider extends Component
  @propTypes: {
    divisions: T.arrayOf(T.object)
    scale: T.func.isRequired
  }
  @defaultProps: {
    divisions: []
    grainSizes: ['ms','s','vf','f','m','c','vc','p']
  }
  grainsizeScale: (range)->
    {grainSizes} = @props
    mn = grainSizes.length-1
    scale = scaleLinear()
      .domain [0,mn]
      .range range
    scaleOrdinal()
      .domain grainSizes
      .range grainSizes.map (d,i)=>scale(i)

  render: ->
    {children, rest...} = @props
    methods = do => {grainsizeScale} = @
    value = {methods..., rest...}
    h ColumnContext.Provider, {value}, children

export {ColumnContext, ColumnProvider}
