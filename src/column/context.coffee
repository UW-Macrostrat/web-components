import {scaleLinear, scaleOrdinal} from "d3"
import {Component, createContext} from "react"
import h from "react-hyperscript"
import T from "prop-types"

ColumnContext = createContext {}

rangeOrHeight = (props, propName)->
  {range, height} = props
  rangeExists = range? and range.length == 2
  heightExists = height?
  return if rangeExists or heightExists
  return new Error "Provide either 'range' or 'height' props"

class ColumnProvider extends Component
  @propTypes: {
    surfaces: T.arrayOf(T.object)
    range: rangeOrHeight
    height: rangeOrHeight
    pixelsPerMeter: T.number.isRequired
    zoom: T.number
  }
  @defaultProps: {
    surfaces: []
    grainSizes: ['ms','s','vf','f','m','c','vc','p']
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

  grainsizeForSurface: (surface)=>
    {surfaces} = @props
    ix = surfaces.indexOf(surface)
    # Search backwards through surfaces
    while ix > 0
      {grainsize} = surfaces[ix]
      console.log surfaces[ix]
      return grainsize if grainsize?
      ix -= 1

  render: ->
    {children
     pixelsPerMeter
     zoom
     height
     range
     rest...} = @props

    ## Calculate correct range and height
    # Range overrides height if set
    if range?
      height = range[1]-range[0]
    else
      range = [0, height]

    # same as the old `innerHeight`
    pixelHeight = height*pixelsPerMeter*zoom

    scale = scaleLinear().domain(range).range([pixelHeight, 0])

    methods = do => {grainsizeScale, grainsizeForsurface} = @
    value = {
      methods...
      pixelsPerMeter
      pixelHeight
      zoom
      range
      height
      scale
      rest...
    }
    h ColumnContext.Provider, {value}, children

export {ColumnContext, ColumnProvider}
