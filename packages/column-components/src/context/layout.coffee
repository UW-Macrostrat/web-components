import {scaleLinear, scaleOrdinal} from "d3"
import {Component, createContext} from "react"
import h from "react-hyperscript"
import T from "prop-types"
import {ColumnContext} from './column'

## This isn't really used yet...

ColumnLayoutContext = createContext {
  scale: null,
  width: 0
}

class ColumnLayoutProvider extends Component
  @propTypes: {
    width: T.number.isRequired
  }
  @contextType: ColumnContext
  render: ->
    {children, rest...} = @props
    value = {@context..., rest...}
    h ColumnLayoutContext.Provider, {value}, children

class GrainsizeLayoutProvider extends Component
  ###
  Right now this provides a ColumnLayoutContext
  but it could be reworked to provide a
  separate "GrainsizeLayoutContext" if that seemed
  appropriate.
  ###
  @contextType: ColumnContext
  @propTypes: {
    width: T.number.isRequired
    grainsizeScaleStart: T.number
    grainSizes: T.arrayOf(T.number)
  }
  @defaultProps: {
    grainSizes: ['ms','s','vf','f','m','c','vc','p']
    grainsizeScaleStart: 50
  }
  grainsizeScale: =>
    {grainSizes, width, grainsizeScaleStart} = @props
    scale = scaleLinear()
      .domain [0,grainSizes.length-1]
      .range [grainsizeScaleStart, width]
    scaleOrdinal()
      .domain grainSizes
      .range grainSizes.map (d,i)=>scale(i)

  grainsizeForDivision: (division)=>
    {divisions} = @context
    ix = divisions.indexOf(division)
    # Search backwards through divisions
    while ix > 0
      {grainsize} = divisions[ix]
      return grainsize if grainsize?
      ix -= 1

  widthForDivision: (division)=>
    return @props.width unless division?
    gs = @grainsizeScale()
    return gs(@grainsizeForDivision(division))

  render: ->
    {width, grainSizes, grainsizeScaleStart, children} = @props
    grainsizeScaleRange = [grainsizeScaleStart, width]
    # This is slow to run each iteration
    h ColumnLayoutProvider, {
      width,
      grainSizes,
      grainsizeScale: @grainsizeScale()
      grainsizeScaleStart,
      grainsizeScaleRange,
      @grainsizeForDivision,
      @widthForDivision,
    }, children


export {ColumnLayoutContext, ColumnLayoutProvider, GrainsizeLayoutProvider}
