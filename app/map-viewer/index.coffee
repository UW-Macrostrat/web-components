{remote} = require 'electron'
L = require 'leaflet'
require 'leaflet/dist/leaflet.css'
require './main.styl'
{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'


# Maybe this should go in main thread
{spawn} = require 'child_process'
path = require 'path'

class MapView extends Component
  render: -> createElement 'div', id: 'map-container'
  setupServer: ->
    console.log "Starting server"
    fn = path.join(process.env.NAUKLUFT_DATA_DIR,"tilesets","Naukluft-satellite.mbtiles")
    args = ['--port', '3005', "mbtiles://#{fn}"]
    name = path.join process.cwd(),"node_modules/.bin/tessera"
    @tessera = spawn name, args

  componentDidMount: ->
    @setupServer()

    el = findDOMNode @
    map = L.map(el).setView([-24.2254,16.1987], 11);

    L.tileLayer 'http://localhost:3005/{z}/{x}/{y}.png'
      .addTo(map)

    #map = new Map el,
      #zoom: 2
      #boxZoom: false
      #continuousWorld: true
      #debounceMoveend: true

    #map.addLayerControl()
    scale = L.control.scale
      maxWidth: 250,
      imperial: false
    scale.addTo map

  componentWillUnmount: ->
    console.log "Killing map server"
    @tessera.kill('SIGINT')

module.exports = MapView
