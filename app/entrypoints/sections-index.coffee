import React from "react"
import ReactDOM from "react-dom"
import {HashRouter,Route,Link, Switch, Redirect} from "react-router-dom"
import {mouseTrap} from "react-mousetrap"
import h from "react-hyperscript"
import {FocusStyleManager} from "@blueprintjs/core"
FocusStyleManager.onlyShowFocusOnTabs()
import {HotkeysTarget, Hotkeys, Hotkey} from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"

global.WEB_MODE=true
import {PlatformProvider} from "../platform"
import {SectionIndex} from "../sections"


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

