{Component} = require 'react'
h = require 'react-hyperscript'
CSSTransition = require 'react-addons-css-transition-group'
require './settings.styl'
Select = require 'react-select'

options = [
  {value: 'normal', label: 'Normal'}
  {value: 'skeleton', label: 'Skeleton'}
]

class ModeControl extends Component
  @props =
    name: 'mode-control'
    value: 'normal'
    options: options
  render: ->
    opts = options.map (d)=>
      props = type: 'button', className: 'pt-button'
      if 'normal' == d.value
        props.className += ' pt-active'
      h 'button', props, d.label

    h 'div', [
      h 'h5', 'Display mode'
      h 'div.pt-vertical.pt-button-group.pt-align-left.pt-fill', opts
    ]

class SettingsPanel extends Component
  render: ->
    body = []
    if @props.active
      body = [
        h 'div#settings', {key: 'settings'}, [
          h 'h2', 'Settings'
          h ModeControl
        ]
      ]

    props = {
      transitionName: "settings"
      transitionEnterTimeout: 1000
      transitionLeaveTimeout: 1000
    }
    h CSSTransition, props, body

module.exports = SettingsPanel
