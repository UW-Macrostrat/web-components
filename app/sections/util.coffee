{Component} = require 'react'
h = require 'react-hyperscript'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'

class SectionNavigationControl extends Component
  render: ->
    backButton = null
    if @props.backLocation?
      backButton = h NavLink, to: @props.backLocation, [
        h Icon, name: 'arrow-left', size: '2x'
      ]

    settings = null
    if @props.toggleSettings
      settings = h 'li', [
        h 'a', onClick: @props.toggleSettings, [
          h Icon, name: 'gear', size: '2x'
        ]
      ]

    {children} = @props

    h 'ul.controls', [
      backButton
      h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
      settings
      children
    ]

module.exports = {SectionNavigationControl}
