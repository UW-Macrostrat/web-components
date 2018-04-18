{Component, createContext} = require 'react'
require './main.styl'
styles = require './section-index.styl'
h = require 'react-hyperscript'
{Route, Switch,withRouter} = require 'react-router-dom'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
{getSectionData, SectionDataContainer} = require './section-data'
SectionPage = require './single-section'
{SummarySections} = require './summary-sections'
{GeneralizedSections} = require './generalized-sections'
{SectionNavigationControl} = require './util'
{FaciesDescriptionPage, FaciesContext} = require './facies-descriptions'
{db, query, storedProcedure} = require './db'

{nest} = require 'd3'

createSectionLink = (d, base)->
  base ?= "sections/"
  navLink = h NavLink, to: base+d.id, [
    h 'div', [
      h 'div.title', [
        h 'span', 'Section '
        h 'span', d.id
      ]
    ]
  ]

class SectionIndexPage extends Component
  render: ->

    {pathname} = @props.location

    nestedSections = nest()
      .key (d)->d.location
      .entries @props.sections

    locations = nestedSections.map (nest)->
      {key,values} = nest
      h 'div.location', [
        h 'h2', key
        h 'ul.navigation.sections', values.map (d)->
          createSectionLink(d)
      ]

    h 'div#homepage', [
      h SectionNavigationControl
      h 'div#homepage-inner', [
        h 'h1', 'Sections'
        h 'ul.navigation', [
          h NavLink, to: "#{pathname}/summary", [
            h 'div.title.summary-sections', 'Summary sections'
          ]
          #h NavLink, to: "#{pathname}/generalized", [
          #  h 'div.title', 'Generalized sections'
          #]
        ]
        locations...
      ]
    ]

class SectionIndex extends SectionDataContainer
  render: =>
    {match} = @props
    {sections, facies, surfaces} = @state

    if sections.length == 0
      return h 'div'

    value = {facies, surfaces, onColorChanged: @changeFaciesColor}
    h FaciesContext.Provider, {value}, [
      h Switch, [
        h Route, {
          path: match.url+'/'
          exact: true
          render: withRouter (props)=>
            h(SectionIndexPage, {sections, props...}, null)
        }
        h Route, {
          path: match.url+'/summary'
          exact: true
          render: => h(SummarySections, {sections}, null)
        }
        h Route, {
          path: match.url+'/generalized'
          exact: true
          render: => h(GeneralizedSections, {sections}, null)
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
    ]

  changeFaciesColor: (id,color)=>
    sql = storedProcedure('set-facies-color', {baseDir: __dirname})
    await db.none sql, {id,color}
    @getFaciesData()



module.exports = {SectionIndex, SectionDataContainer}
