import {findDOMNode} from "react-dom"
import {Component} from "react"
import d3 from "d3"
import "d3-selection-multi"
import "d3-jetpack"
import h from "react-hyperscript"
import createLegend from "."
import "./main.styl"

class MapLegend extends Component
  @defaultProps: {}
  constructor: (props)->
    super props
    @state =
      data: []
  render: ->
    h 'div#map-legend'

  componentDidMount: ->
    el = findDOMNode @
    createLegend el

export MapLegend

