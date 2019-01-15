React = require 'react'
ReactDOM = require 'react-dom'
{HashRouter,Route,Link, Switch, Redirect} = require 'react-router-dom'
{mouseTrap} = require 'react-mousetrap'
h = require 'react-hyperscript'
{FocusStyleManager} = require '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()
{HotkeysTarget, Hotkeys, Hotkey} = require '@blueprintjs/core'
require '@blueprintjs/core/lib/css/blueprint.css'

global.WEB_MODE=true
{PlatformProvider} = require '../platform'
{SectionIndex} = require '../sections'


route = (path, component, props={})->
  h Route, {props...,path,component}

class App extends React.Component
  constructor: ->
    super()
    @state = {}
    @state.showNavBar = false
  render: ->
    h PlatformProvider, [
      h 'div#root', [
        h Switch, [
          h Route, {
            exact: true, path:'/', render: =>
              h Redirect, {to: '/sections'}
          }
          route '/sections', SectionIndex
        ]
      ]
    ]

  renderHotkeys: ->
    console.log "Rendering hotkeys"
    h Hotkeys, {tabIndex: null}, [
      h Hotkey, {
        global: true
        combo: "r"
        label:"Reload"
        onKeyDown: -> console.log("Awesome!")
      }
    ]

# This doesn't work for unknown reasons
HotkeysTarget(App)

Router = -> h HashRouter, [
  h(App)
]
ReactDOM.render(React.createElement(Router),document.querySelector('#main'))

