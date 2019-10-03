import h from '~/hyper'
import {StratColumn} from './column'
import defaultSurfaces from './default-surfaces.json'

console.log defaultSurfaces

for surface,i in defaultSurfaces
  try
    surface.top = defaultSurfaces[i+1].bottom
  catch
    surface.top = 400

App = ->
  h 'div.app', [
    h StratColumn, {
      initialSurfaces: defaultSurfaces
    }
  ]

export {App}
