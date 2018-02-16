{Component} = require 'react'
h = require 'react-hyperscript'

class Legend extends Component
  render: ->
    h 'div.legend', 'Legend'

module.exports = {Legend}
