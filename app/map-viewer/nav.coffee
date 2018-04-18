{Component} = require 'react'
h = require 'react-hyperscript'
{NavLink, BackLink} = require '../nav'
{Icon} = require 'react-fa'

class MapNavigationControl extends Component
  render: ->
    settings = null
    if @props.toggleLegend
      settings = h 'li', [
        h 'a', onClick: @props.toggleLegend, [
          h Icon, name: 'info', size: '2x'
        ]
      ]
    {children} = @props

    homeLink = null
    try
      h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
    catch
      {}


    h 'ul.controls', [
      homeLink
      settings
      children
    ]


module.exports = {MapNavigationControl}

