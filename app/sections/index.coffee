import {Component, createContext} from "react"
import "./main.styl"
import styles from "./section-index.styl"
import h from "react-hyperscript"
import {Route, Switch,withRouter} from "react-router-dom"
import {NavLink} from "../nav"
import {Icon} from "react-fa"
import {SectionDataProvider, SectionConsumer} from "./section-data"
import SectionPage from "./single-section"
import {SummarySections} from "./summary-sections"
import {GeneralizedSections} from "./generalized-sections"
import {SectionNavigationControl} from "./util"
import {FaciesDescriptionPage} from "./facies-descriptions"
import {RegionalCrossSectionPage} from "./regional-cross-section"
import {nest} from "d3"

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
        h 'div.title-block', [
          h 'h1', 'Stratigraphic sections of the Zebra Nappe'
          h 'p.author', 'Dissertation plate 5.2 – Daven Quinn'
          h 'p', "Summary sections can be used to access
                  detailed sections"
        ]
        h 'ul.navigation', [
          h NavLink, to: "#{pathname}/summary", [
            h 'div.title.summary-sections', 'Summary sections'
          ]
          h NavLink, to: "#{pathname}/generalized", [
            h 'div.title', 'Generalized sections'
          ]
          h NavLink, to: "#{pathname}/regional", [
            h 'div.title.regional', 'Regional cross section'
          ]
        ]
        locations...
      ]
    ]

wrapWithSections = (component)=> (props)=>
  h SectionConsumer, null, ({sections})=>
    if sections.length == 0
      return h 'div'
    h(component, {sections, props...}, null)


class SectionIndex extends Component
  render: =>
    {match} = @props
    h SectionDataProvider, [
      h Switch, [
        h Route, {
          path: match.url+'/'
          exact: true
          render: withRouter (props)=>
            h wrapWithSections(SectionIndexPage), props
        }
        h Route, {
          path: match.url+'/summary'
          exact: true
          render: => h(wrapWithSections(SummarySections))
        }
        h Route, {
          path: match.url+'/generalized'
          exact: true
          render: =>
            h(wrapWithSections(GeneralizedSections))
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
          path: match.url+'/regional'
          exact: true
          render: => h(RegionalCrossSectionPage, {}, null)
        }
        h Route, {
          path: match.url+'/:id/height/:height', render: (props)->
            h SectionConsumer, null, ({sections})->
              {id,height} = props.match.params
              section = sections.find (d)->d.id == id
              if not section?
                return h 'div'
              h SectionPage, {section, height}
        }
        h Route, {
          path: match.url+'/:id/',
          render: (props)->
            h SectionConsumer, null, ({sections})->
              {id,height} = props.match.params
              section = sections.find (d)->d.id == id
              if not section?
                return h 'div'
              h SectionPage, {section}
        }
      ]
    ]

export {SectionIndex, SectionDataProvider}
