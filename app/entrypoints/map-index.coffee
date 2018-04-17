{Component, createElement} = require 'react'
{render} = require 'react-dom'
h = require 'react-hyperscript'

global.WEB_MODE=true
{PlatformContext} = require '../platform'
{MapView} = require '../map-viewer'

class App extends Component
  constructor: ->
    super()
  render: ->
    h PlatformContext.Provider, [
      h MapView, {}
    ]

render(createElement(App),document.querySelector('#main'))

