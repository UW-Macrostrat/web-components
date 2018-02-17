{Component} = require 'react'
require './main.styl'
styles = require './section-index.styl'
h = require 'react-hyperscript'
{Route, Switch} = require 'react-router-dom'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
{getSectionData, SectionDataContainer} = require './section-data'
SectionPage = require './single-section'
SummarySections = require './summary-sections'
{AllSections} = require './section-page'
{SectionNavigationControl} = require './util'
{FaciesDescriptionPage} = require './facies-descriptions'

{nest} = require 'd3'

createSectionLink = (d)->
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

  render: ->

    nestedSections = nest()
      .key (d)->d.location
      .entries @props.sections

    locations = nestedSections.map (nest)->
      {key,values} = nest
      h 'div.location', [
        h 'h2', key
        h 'ul.navigation.sections', values.map createSectionLink
      ]

    h 'div#homepage', [
      h SectionNavigationControl
      h 'div#section-pane', [
        h 'h1', 'Sections'
        h 'ul.navigation', [
          h NavLink, to: "/sections/summary", [
            h 'div.title', 'Summary sections'
          ]
          h NavLink, to: "/sections/facies-descriptions", [
            h 'div.title', 'Facies descriptions'
          ]
        ]
        locations...
      ]
    ]

class SectionIndex extends SectionDataContainer
  render: ->
    {match} = @props
    {sections} = @state

    if sections.length == 0
      return h 'div'

    h Switch, [
      h Route, {
        path: match.url+'/'
        exact: true
        render: => h(SectionIndexPage, {sections}, null)
      }
      h Route, {
        path: match.url+'/summary'
        exact: true
        render: => h(SummarySections, {sections}, null)
      }
      h Route, {
        path: match.url+'/facies-descriptions'
        exact: true
        render: => h(FaciesDescriptionPage, {}, null)
      }
      h Route, {
        path: match.url+'/all'
        exact: true
        render: => h(AllSections, {sections}, null)
      }
      h Route, {
        path: match.url+'/:id/height/:height', render: (props)->
          {id,height} = props.match.params
          section = sections.find (d)->d.id == id
          if not section?
            return h 'div'
          h SectionPage, {section, height}
      }
      h Route, {
        path: match.url+'/:id/', render: (props)->
          {id,height} = props.match.params
          section = sections.find (d)->d.id == id
          if not section?
            return h 'div'
          h SectionPage, {section}
      }
    ]

module.exports = {SectionIndex, SectionDataContainer}
