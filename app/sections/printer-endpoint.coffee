{render} = require 'react-dom'
{createElement, Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'

{getSectionData} = require './section-data'
{SectionPanel} = require './panel'

module.exports = (el, cb)->

  sections = await getSectionData()

  class Page extends Component
    render: ->
      h SectionPanel, {sections, trackVisibility: false}

  render(createElement(Page),el)

  fn = ->cb()
  setTimeout fn, 5000
