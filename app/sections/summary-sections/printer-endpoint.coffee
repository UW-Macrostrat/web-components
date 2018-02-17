require '../../set-platform'
{render} = require 'react-dom'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
d3 = require 'd3'
require 'd3-selection-multi'
{SectionDataContainer} = require '../section-data'
{SummarySections} = require '.'
{HashRouter} = require 'react-router-dom'


class SectionsPage extends SectionDataContainer
  render: ->
    {sections} = @state
    h SummarySections, {sections}

Router = -> h HashRouter, [ h SectionsPage ]

module.exports = (el, cb)->
  v = d3.select el
    .append 'div'

  render(
    createElement(Router)
    v.node()
  )

  setTimeout cb, 3000

