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
  ###
  Lays out a column on its Y (height) axis.
  This component would be swapped to provide eventual generalization to a Wheeler-diagram
  (time-domain) framework.
  ###
  @propTypes: {
    divisions: T.arrayOf(T.object)
    range: rangeOrHeight
    height: rangeOrHeight
    pixelsPerMeter: T.number.isRequired
    zoom: T.number
  }
  @defaultProps: {
    divisions: []
    width: 150
    pixelsPerMeter: 20
    zoom: 1
  }

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
      height = Math.abs(range[1]-range[0])
    else
      range = [0, height]

    # same as the old `innerHeight`
    pixelHeight = height*pixelsPerMeter*zoom

    scale = scaleLinear().domain(range).range([pixelHeight, 0])
    scaleClamped = scale.copy().clamp(true)

    value = {
      pixelsPerMeter
      pixelHeight
      zoom
      range
      height
      scale
      scaleClamped
      rest...
    }
    h ColumnContext.Provider, {value}, children

export {ColumnContext, ColumnProvider}
