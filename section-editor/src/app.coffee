import {hyperStyled} from '@macrostrat/hyper'
import {StratColumn} from './column'
import styles from './main.styl'

h = hyperStyled(styles)

App = ->
  h 'div.column-container', [
    h StratColumn, {surfaces: []}
  ]

export {App}
