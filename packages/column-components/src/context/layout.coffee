import {scaleLinear, scaleOrdinal} from "d3"
import {Component, createContext} from "react"
import h from "react-hyperscript"
import T from "prop-types"
import {ColumnContext} from './column'

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
    colCtx = @context

    value = {width, rest..., colCtx...}

    h ColumnLayoutContext.Provider, {value}, children

class GrainsizeAxisProvider extends Component
  @contextType: ColumnContext
  @propTypes: {
    grainsizeScaleStart: T.number
    width: T.number.isRequired
  }
  @defaultProps: {
    divisions: []
    grainSizes: ['ms','s','vf','f','m','c','vc','p']
    grainsizeScaleStart: 50
    width: 150
    pixelsPerMeter: 20
    zoom: 1
  }
  grainsizeScale: (pixelRange)=>
    {grainSizes} = @props
    scale = scaleLinear()
      .domain [0,grainSizes.length-1]
      .range pixelRange
    scaleOrdinal()
      .domain grainSizes
      .range grainSizes.map (d,i)=>scale(i)

  grainsizeForDivision: (division)=>
    {divisions} = @context
    ix = divisions.indexOf(division)
    # Search backwards through divisions
    while ix > 0
      {grainsize} = divisions[ix]
      console.log divisions[ix]
      return grainsize if grainsize?
      ix -= 1

  render: ->
    {width, grainSizes, grainsizeScaleStart, children} = @props

    # This is slow to run each iteration
    methods = do => {grainsizeScale, grainsizeForDivision} = @

    h ColumnLayoutProvider, {
      grainSizes,
      grainsizeScaleStart,
      grainsizeScaleRange,
      methods...
    }, children


export {ColumnLayoutContext, ColumnLayoutProvider}
