{remote} = require 'electron'
{Map} = require 'gis-core'
L = require 'leaflet'
require 'gis-core/build/style.css'
require './main.styl'

# Maybe this should go in main thread
{spawn} = require 'child_process'
path = require 'path'

fn = path.join(process.env.NAUKLUFT_DATA_DIR,"tilesets","Naukluft-satellite.mbtiles")

args = ['--port', '3000', "mbtiles://#{fn}"]
name = path.join process.cwd(),"node_modules/.bin/tessera"
tessera = spawn name, args


el = document.querySelector '#main'

map = new Map el,
  zoom: 2
  boxZoom: false
  continuousWorld: true
  debounceMoveend: true

map.addLayerControl()

scale = L.control.scale
  maxWidth: 250,
  imperial: false
scale.addTo map
