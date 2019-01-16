import {findDOMNode} from "react-dom"
import {Component} from "react"
import d3 from "d3"
import h from "react-hyperscript"
import createVisualization from "."

class LateralVariation extends Component
  render: ->
    h 'div#lateral-variation'
  componentDidMount: ->
    node = findDOMNode @
    createVisualization(node)

export default LateralVariation


