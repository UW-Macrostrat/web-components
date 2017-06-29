{remote} = require 'electron'
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
            tiles: ["http://localhost:39805/satellite/{z}/{x}/{y}@2x.png"]
            tileSize: 256
          geology:
            type: 'raster'
            tiles: ["http://localhost:39805/geology/{z}/{x}/{y}/tile@2x.png"]
            tileSize: 256
        layers: [
          {id: "geology", type: "raster", source: "geology"}
          #{id: "contact", type: "line", source: "contact", 'source-layer': "contact"}
        ]

module.exports = MapView
