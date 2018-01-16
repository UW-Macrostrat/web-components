{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{SectionNavigationControl} = require '../util'
require './main.styl'
d3 = require 'd3'
h = require 'react-hyperscript'
{join} = require 'path'
db = require '../../db'
chroma = require 'chroma-js'
{flatten, zip} = require 'underscore'

query = (id)->
  db.query id, null, {baseDir: join(__dirname,'../../lateral-variation')}

class SectionsContainer extends Component
  constructor: (props)->
    super props
    @state = {}

  render: ->
    {heights, sections, surfaces} = @state
    return null unless heights?
    console.log "Rendering"

    size = {width: 1200,height: 1000}

    locations = d3.nest()
      .key (d)->d.location
      .entries sections

    console.log locations
    groupSpacing = 20

    current = 0
    h 'svg.summary-sections', {
        size...
        xmlns: "http://www.w3.org/2000/svg"
      },
      locations.map (d,i)->
        console.log d
        h 'g.location', {transform: "translate(#{i*300} 10)"}, [
          h 'text', {transform: "translate(0,500)"}, d.key
        ]

  componentDidMount: ->
    el = findDOMNode @
    heights = await query("unit-heights")
    sections = await query("sections")
    surfaces = await query("boundary-heights")
    console.log "Setting state"
    @setState {heights, sections, surfaces}


class SummarySections extends Component
  constructor: (props)->
    super props
    @state = {}
  render: ->
    h 'div', [
      h SectionNavigationControl, {backLocation: '/sections'}
      h 'div.section-pane', [
        h SectionsContainer
      ]
    ]

module.exports = SummarySections
