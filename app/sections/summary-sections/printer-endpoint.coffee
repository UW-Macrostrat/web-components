require '../../set-platform'
{render} = require 'react-dom'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
d3 = require 'd3'
require 'd3-selection-multi'
{SectionDataContainer} = require '../section-data'
require '../main.styl'
require '../../main.styl'
require './print.styl'
{SummarySections: BaseSummarySections} = require '.'
{HashRouter} = require 'react-router-dom'

class SummarySections extends BaseSummarySections
  render: ->
    h 'div', [
      @renderSections()
    ]

class SectionsPage extends SectionDataContainer
  render: ->
    {sections} = @state
    scrollable = false
    h SummarySections, {sections, scrollable}

Router = -> h HashRouter, [ h SectionsPage ]

module.exports = (el, cb)->

  render(
    createElement(Router)
    el
  )

  setTimeout cb, 3000

