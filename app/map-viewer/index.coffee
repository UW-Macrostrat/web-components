{remote} = require 'electron'
require './main.styl'
React = require 'react'
ReactDOM = require 'react-dom'
require 'mapbox-gl/dist/mapbox-gl.css'
mgl = require 'mapbox-gl/dist/mapbox-gl'

# Maybe this should go in main thread
{spawn} = require 'child_process'
path = require 'path'

class MapView extends React.Component
  render: -> React.createElement 'div', id: 'map-container'
  setupServer: ->
    console.log "Starting server"
    args = ['--port', '3005', '-c', process.env.TESSERA_CONFIG]
    name = path.join process.cwd(),"node_modules/.bin/tessera"
    @tessera = spawn name, args

  componentDidMount: ->
    @setupServer()

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
            tiles: ["http://localhost:3005/satellite/{z}/{x}/{y}@2x.png"]
            tileSize: 512
          contact:
            type: 'vector'
            url: "http://localhost:3005/contact/index.json"
        layers: [
          {id: "satellite", type: "raster", source: "satellite"}
          {id: "contact", type: "vector", source: "contact"}
        ]

  componentWillUnmount: ->
    console.log "Killing map server"
    @tessera.kill('SIGINT')

module.exports = MapView
