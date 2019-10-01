import {hyperStyled} from '@macrostrat/hyper'
import {StratColumn} from './column'
import styles from './main.styl'
import defaultSurfaces from './default-surfaces.json'

console.log defaultSurfaces

for surface,i in defaultSurfaces
  try
    surface.top = defaultSurfaces[i+1].bottom
  catch
    surface.top = 400

h = hyperStyled(styles)

App = ->
  h 'div.column-container', [
    h StratColumn, {surfaces: defaultSurfaces}
  ]

export {App}
