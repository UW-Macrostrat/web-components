{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
SettingsPanel = require './settings'
update = require 'immutability-helper'
LocalStorage = require './storage'
{getSectionData} = require './section-data'
Measure = require('react-measure').default
{ZoomablePanelContainer} = require './panel'
PropTypes = require 'prop-types'
{ Hotkey, Hotkeys, HotkeysTarget } = require "@blueprintjs/core"

{nest} = require 'd3'

createSectionLink = (d)->
  console.log d
  navLink = h NavLink, to: "/sections/"+d.id, [
    h 'div', [
      h 'h3', [
        h 'span', 'Section'
        h 'span', d.id
      ]
    ]
  ]

  navLink

class SectionIndexPage extends Component
  constructor: (props)->
    super props
    @state =
      sections: []

  render: ->

    nestedSections = nest()
      .key (d)->d.location
      .entries @state.sections

    console.log nestedSections

    obj =
      bounds: true,
      offset: true,
      scroll: true,
      client: true,

    locations = nestedSections.map (nest)->
      {key,values} = nest
      h 'div.location', [
        h 'h2', key
        h 'ul.sections', values.map createSectionLink
      ]

    h 'div#section-pane', [
      h 'ul.controls', [
        h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
      ]
      h 'div#homepage', [
        h 'h1', 'Sections'
        locations...
      ]
    ]

  getInitialData: ->
    sections = await getSectionData()
    @setState sections: sections

  componentDidMount: ->
    @getInitialData()

module.exports = SectionIndexPage
