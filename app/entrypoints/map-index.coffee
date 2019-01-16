import {Component, createElement} from "react"
import {render} from "react-dom"
import h from "react-hyperscript"

global.WEB_MODE=true
import {PlatformContext} from "../platform"
import {MapView} from "../map-viewer"

class App extends Component
  constructor: ->
    super()
  render: ->
    h PlatformContext.Provider, [
      h MapView, {}
    ]

render(createElement(App),document.querySelector('#main'))

