React = require 'react'
ReactDOM = require 'react-dom'
{HashRouter,Route,Link} = require 'react-router-dom'
{mouseTrap} = require 'react-mousetrap'
h = require 'react-hyperscript'
require '@blueprintjs/core/dist/blueprint.css'

{Icon} = require 'react-fa'
{NavBar, NavLink} = require './nav'
SectionPage = require './sections'
CarbonIsotopesPage = require './carbon-isotopes'
LateralVariation = require './lateral-variation/component'
Map = require './map-viewer'
#style = require './main.styl'
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

class App extends React.Component
  constructor: ->
    @state = {}
    @state.showNavBar = true
  render: ->
    <div id="root">
      <Route exact path="/" component={Home}/>
      <Route path="/sections" component={SectionPage}/>
      <Route path="/carbon-isotopes" component={wrapNavBar(CarbonIsotopesPage)}/>
      <Route path="/lateral-variation" component={wrapNavBar(LateralVariation)} />
      <Route path="/map" component={wrapHomeButton(Map)}/>
    </div>

  _toggleNavBar: =>
    @setState showNavBar: not @state.showNavBar

  componentWillMount: ->
    @props.bindShortcut 'f', @_toggleNavBar

  componentWillUnmount: ->
    @props.unbindShortcut 'f'

Router = -> h HashRouter, [ h mouseTrap(App) ]

navLink = -> h NavLink, arguments...

Home = ->
  h 'div#homepage', [
    h 'h1', 'Naukluft Nappe Complex'
    h 'p', 'Data products of research in the Southern Naukluft mountains, for presentation on the web alongside journal publication'
    h 'ul', className: 'navigation', [
      navLink to: '/sections', "Sections"
      navLink to: '/carbon-isotopes', "Carbon Isotopes"
      navLink to: '/lateral-variation', "Lateral Variation"
      navLink to: '/map', "Map"
    ]
  ]

ReactDOM.render(React.createElement(Router),document.querySelector('#main'))
