{Component} = require 'react'
require './main.styl'
styles = require './section-index.styl'
h = require 'react-hyperscript'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
{getSectionData} = require './section-data'

{nest} = require 'd3'

createSectionLink = (d)->
  console.log d
  navLink = h NavLink, to: "/sections/"+d.id, [
    h 'div', [
      h 'div.title', [
        h 'span', 'Section '
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

    locations = nestedSections.map (nest)->
      {key,values} = nest
      h 'div.location', [
        h 'h2', key
        h 'ul.navigation.sections', values.map createSectionLink
      ]

    h 'div#homepage', [
      h 'ul.controls', [
        h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
      ]
      h 'div#section-pane', [
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
