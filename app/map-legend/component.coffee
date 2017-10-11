{findDOMNode} = require 'react-dom'
{Component} = require 'react'
d3 = require 'd3'
require 'd3-selection-multi'
require 'd3-jetpack'
h = require 'react-hyperscript'
createLegend = require '.'
require './main.styl'

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

module.exports = MapLegend

