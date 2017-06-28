{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
ipc = require('electron').ipcRenderer
{NavLink} = require '../nav'
{Icon} = require 'react-fa'

{SectionComponent} = require 'stratigraphic-column'
{getSectionData} = require 'stratigraphic-column/src/util'

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      zoom: 1
      sections: []

  render: ->
    props =
      id: 'section-page'


    body = h 'div', props, @state.sections.map (row)=>
      row.key = row.id # Because react
      row.zoom = @state.zoom
      h SectionComponent, row

    h 'div.page', [
      h 'ul.controls', [
        h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
        h 'li', [h 'a', [h Icon, name: 'gear', size: '2x']]
      ]
      body
    ]


  componentDidMount: ->
    getSectionData()
      .then (sections)=>
        @setState sections: sections
        _el = findDOMNode @
        el = select _el
        el.selectAll 'img'
          .on 'load', ->
            console.log "Loaded all images"

    @setupListeners()

  setupListeners: =>
    ipc.on 'zoom-reset', =>
      @setState zoom: 1
    ipc.on 'zoom-in', =>
      z = @state.zoom * 1.25
      @setState zoom: z
    ipc.on 'zoom-out',=>
      z = @state.zoom / 1.25
      @setState zoom: z



module.exports = SectionPage
