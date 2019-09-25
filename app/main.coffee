import "~/node_modules/@macrostrat/ui-components/init.js"
requireFoolWebpack = require 'require-fool-webpack'
# Because webpack is super annoying

import {PlatformContext, PlatformProvider} from "./platform"
import React from "react"
import ReactDOM from "react-dom"
import {HashRouter,Route,Link, Switch} from "react-router-dom"
import {mouseTrap} from "react-mousetrap"
import h from "react-hyperscript"
import {FocusStyleManager} from "@blueprintjs/core"
FocusStyleManager.onlyShowFocusOnTabs()

import {Icon} from "react-fa"
import {NavBar, NavLink} from "./nav"
import {SectionIndex} from "./sections"
#MapLegend = require './map-legend/component'
import CarbonIsotopesPage from "./carbon-isotopes"
import LateralVariation from "./lateral-variation/component"
import {MapView} from "./map-viewer"
import {HotkeysTarget, Hotkeys, Hotkey} from "@blueprintjs/core"
import "~/node_modules/@blueprintjs/core/lib/css/blueprint.css"

wrapNavBar = (component)->
  class NavBarPage extends React.Component
    render: ->
      h 'div', className: 'page', [
        h NavBar
        h component
      ]

wrapHomeButton = (component)->
  class HomeButtonPage extends React.Component
    render: ->
      h 'div.page', [
        h 'ul.controls', [
          h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
        ]
        h component
      ]

route = (path, component, props={})->
  h Route, {path,component,props...}

class App extends React.Component
  constructor: ->
    super()
    @state = {}
    @state.showNavBar = true
  render: ->
    h PlatformProvider, [
      h 'div#root', [
        h Switch, [
          route '/', Home, exact: true
          route '/sections', SectionIndex
          route '/carbon-isotopes', wrapNavBar(CarbonIsotopesPage)
          route '/lateral-variation', wrapNavBar(LateralVariation)
          route '/map', MapView
          #route '/map-legend', wrapNavBar(MapLegend)
        ]
      ]
    ]
  _toggleNavBar: =>
    @setState showNavBar: not @state.showNavBar

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

navLink = -> h NavLink, arguments...

Home = ->
  h 'div#homepage', [
    h 'div#homepage-inner', [
      h 'h1', 'Naukluft Nappe Complex'
      h 'p', 'Data products of research in the Southern Naukluft mountains, for presentation on the web alongside journal publication'
      h 'ul', className: 'navigation', [
        navLink to: '/sections', "Sections"
        navLink to: '/carbon-isotopes', "Carbon Isotopes"
        navLink to: '/lateral-variation', "Lateral Variation"
        navLink to: '/map', "Map"
        navLink to: '/map-legend', "Map legend"
      ]
    ]
  ]

ReactDOM.render(React.createElement(Router),document.querySelector('#app'))
