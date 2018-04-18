require './main.styl'
React = require 'react'
ReactDOM = require 'react-dom'
mgl = require 'mapbox-gl/dist/mapbox-gl'
h = require 'react-hyperscript'
{LegendPanel} = require './legend/index.coffee'
{MapNavigationControl} = require './nav'
require 'mapbox-gl/dist/mapbox-gl.css'
# Maybe this should go in main thread
path = require 'path'

class MapPanel extends React.Component
  render: -> h 'div', {id: 'map-container'}

  componentDidMount: ->

    el = ReactDOM.findDOMNode @

    if PLATFORM == ELECTRON
      #tileUrl = BASE_URL+"tiles"
      tileUrl = "http://localhost:3006/tiles/geology"
    else
      tileUrl = BASE_URL+"tiles"

    map = new mgl.Map
      container: el
      attributionControl: false
      center: [16.1987, -24.2254]
      zoom: 11
      trackResize: true
      style: #"mapbox://styles/mapbox/satellite-v9"
        version: 8
        sources:
          satellite:
            type: 'raster'
            tiles: ["http://localhost:3006/tiles/satellite/{z}/{x}/{y}.png"]
            tileSize: 256
          geology:
            type: 'raster'
            tiles: ["#{tileUrl}/{z}/{x}/{y}.png"]
            tileSize: 256
        layers: [
          {id: "geology", type: "raster", source: "geology"}
        ]

class MapView extends React.Component
  constructor: ->
    super()
    @state = {legendIsActive: true}
  toggleLegend: =>
    @setState {legendIsActive: not @state.legendIsActive}
  render: ->
    h 'div#map-root', {}, [
      h 'div#map-panel-container', {}, [
        h MapNavigationControl, {toggleLegend: @toggleLegend}
        h MapPanel
      ]
      h LegendPanel, {isActive: @state.legendIsActive}
    ]

module.exports = {MapView}
