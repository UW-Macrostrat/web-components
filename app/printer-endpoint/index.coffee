{render} = require 'react-dom'
{createElement, Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
moment = require 'moment'
{getSectionData} = require '../sections/section-data'
{SectionPanel} = require '../sections/panel'
CarbonIsotopesPanel = require '../carbon-isotopes'
LateralVariation = require '../lateral-variation/component'

module.exports = (el, cb)->

  sections = await getSectionData()

  class Page extends Component
    render: ->
      date = moment().format('MMMM YYYY')
      h 'div.sections-print', [
        h 'div.title-section', [
          h 'h1', "Stratigraphy of the Zebra Nappe"
          h 'h2.info.location', "Southern Naukluft Mountains, Namibia"
          h 'h2.info.author', "Daven Quinn et al."
          h 'h2.info.date', "#{date} version"
        ]
        h SectionPanel, {sections, trackVisibility: false}
        h 'div.charts', [
          h 'div', [
            h 'h3', 'Schematic lithostratigraphy'
            h LateralVariation
          ]
          h 'div', [
            h 'h3', 'Carbon isotopes'
            h CarbonIsotopesPanel
          ]
        ]
      ]

  render(createElement(Page),el)

  fn = ->cb()
  setTimeout fn, 5000
