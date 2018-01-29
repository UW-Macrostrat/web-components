{Component} = require 'react'
h = require 'react-hyperscript'
{NavLink, BackLink} = require '../nav'
{Icon} = require 'react-fa'

class SectionNavigationControl extends Component
  render: ->
    settings = null
    if @props.toggleSettings
      settings = h 'li', [
        h 'a', onClick: @props.toggleSettings, [
          h Icon, name: 'gear', size: '2x'
        ]
      ]

    {children} = @props

    h 'ul.controls', [
      h BackLink
      h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
      settings
      children
    ]

module.exports = {SectionNavigationControl}
