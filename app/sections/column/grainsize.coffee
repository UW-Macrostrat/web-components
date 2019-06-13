import {scaleLinear, scaleOrdinal} from "d3"
import {Component} from "react"
import {ColumnContext} from './context'
import h from "react-hyperscript"

grainSizes = ['ms','s','vf','f','m','c','vc','p']
createGrainsizeScale = (range)->
  mn = grainSizes.length-1
  scale = scaleLinear()
    .domain [0,mn]
    .range range
  scaleOrdinal()
    .domain grainSizes
    .range grainSizes.map (d,i)=>scale(i)

class GrainsizeScale extends Component
  @contextType: ColumnContext
  @defaultProps: {
    height: 20
  }
  render: ->
    {grainsizeScale} = @context
    gs = createGrainsizeScale(@props.range)
    sizes = gs.domain()
    h 'g.grainsize.axis', sizes.map (d)=>
      h 'g.tick', transform: "translate(#{gs(d)} 0)", key: d, [
        h 'text.top', {y: 0}, d
        h 'text.bottom', {y: @props.height}, d
        h 'line', {y1: 0, x1: 0, x2: 0, y2: @props.height}
      ]

export {GrainsizeScale, grainSizes, createGrainsizeScale}
