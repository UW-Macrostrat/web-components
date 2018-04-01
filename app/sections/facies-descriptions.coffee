{findDOMNode} = require 'react-dom'
{Component, createContext} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
SettingsPanel = require './settings'
update = require 'immutability-helper'
{SectionNavigationControl} = require './util'
LocalStorage = require './storage'
{db, storedProcedure, query} = require './db'
d3 = require 'd3'
classNames = require 'classnames'
{SwatchesPicker} = require 'react-color'
{Popover} = require '@blueprintjs/core'
{readFileSync} = require 'fs'
{dirname} = require 'path'
{PlatformContext} = require '../platform'

FaciesContext = createContext {facies:[],onColorChanged: ->}

class FaciesDescriptionPage extends Component
  defaultProps: {
    isEditable: false
  }
  constructor: (props)->
    super props
    @state = {
      options: {
        isEditable: false
      }
    }

  render: ->
    __a = '../../assets/facies-descriptions/facies-descriptions.html'
    fn = require.resolve __a
    dir = dirname(fn)
    html = readFileSync(fn, 'utf-8')
    __html = html.replace(/\*\*\//g,"file://#{dir}/images/")
    dangerouslySetInnerHTML = {__html}
    h 'div.page.facies-descriptions.text-page', [
      h SectionNavigationControl
      h 'div.facies-descriptions', {
        dangerouslySetInnerHTML
      }
   ]

class FaciesDescriptionSmall extends Component
  @defaultProps: {selected: null, isEditable: false}
  render: ->
    h FaciesContext.Consumer, {}, ({facies, onColorChanged})=>
      h 'div.facies-description-small', [
        h 'h5', 'Facies'
        h 'div', facies.map (d)=>
          onClick = null
          style = {}
          if @props.onClick?
            onClick = =>@props.onClick(d)
            style.cursor = 'pointer'
          {selected} = @props
          if selected == d.id
            style.backgroundColor = d.color
            style.color = 'white'
          className = classNames({selected: selected == d.id})

          h 'div.facies.pt-card.pt-elevation-0', {
            key: d.id, onClick, style, className
          }, @renderFacies(d, onColorChanged)
      ]

  renderFacies: (d, callback)=>
    swatch = h 'div.color-swatch', {style: {
      backgroundColor: d.color or 'black'
      width: '2em'
      height: '2em'
    }}
    if @props.isEditable
      swatch = h Popover, {
        tetherOptions:{
          constraints: [{ attachment: "together", to: "scrollParent" }]
        }
      }, [
        swatch
        h 'div', [
          h SwatchesPicker, {
            color: d.color or 'black'
            onChangeComplete: (color)->
              callback(d.id, color.hex)
            styles: {
              width: 500
              height: 570
            }
          }
        ]
      ]


    h 'div.header', [
      swatch
      h 'p.name', {style: {marginLeft: 20, textAlign: 'right'}}, d.name
    ]

module.exports = {FaciesDescriptionPage, FaciesDescriptionSmall, FaciesContext}

