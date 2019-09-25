import {scaleLinear, scaleOrdinal} from "d3"
import {Component} from "react"
import {ColumnContext} from './context'
import h from "react-hyperscript"
import T from "prop-types"

grainSizes = ['ms','s','vf','f','m','c','vc','p']
createGrainsizeScale = (range)->
  mn = grainSizes.length-1
  scale = scaleLinear()
    .domain [0,mn]
    .range range
  scaleOrdinal()
    .domain grainSizes
    .range grainSizes.map (d,i)=>scale(i)

class GrainsizeAxis extends Component
  @contextType: ColumnContext
  @defaultProps: {
    height: 20
  }
  @propTypes: {
    range: T.arrayOf(T.number)
  }
  render: ->
    {grainsizeScale, pixelHeight} = @context
    gs = grainsizeScale(@props.range)
    sizes = gs.domain()
    h 'g.grainsize.axis', sizes.map (d)=>
      h 'g.tick', transform: "translate(#{gs(d)} 0)", key: d, [
        h 'text.top', {y: 0}, d
        h 'text.bottom', {y: pixelHeight}, d
        h 'line', {y1: 0, x1: 0, x2: 0, y2: pixelHeight}
      ]

export {GrainsizeAxis, grainSizes, createGrainsizeScale}
