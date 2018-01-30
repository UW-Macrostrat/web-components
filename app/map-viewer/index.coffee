require './main.styl'
React = require 'react'
ReactDOM = require 'react-dom'
require 'mapbox-gl/dist/mapbox-gl.css'
mgl = require 'mapbox-gl/dist/mapbox-gl'

# Maybe this should go in main thread
path = require 'path'

class MapView extends React.Component
  render: -> React.createElement 'div', id: 'map-container'

  componentDidMount: ->

    el = ReactDOM.findDOMNode @

    if PLATFORM == ELECTRON
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
          #{id: "contact", type: "line", source: "contact", 'source-layer': "contact"}
        ]

module.exports = MapView
