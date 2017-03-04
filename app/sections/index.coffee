{findDOMNode} = require 'react-dom'
{Component, createElement} = require 'react'
loadSections = require './sections'


class SectionPage extends Component
  render: ->
    createElement 'div', id: 'wrap'
  componentDidMount: ->
    el = findDOMNode @
    loadSections el

module.exports = SectionPage
