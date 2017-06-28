{Component} = require 'react'
h = require 'react-hyperscript'
CSSTransition = require 'react-addons-css-transition-group'
require './settings.styl'
Select = require 'react-select'

class ModeControl extends Component
  render: ->
    opts = @props.modes.map (d)=>
      props =
        type: 'button'
        className: 'pt-button'
        onClick: =>@update(d.value)
      if @props.activeMode == d.value
        props.className += ' pt-active'
      h 'button', props, d.label

    h 'div', [
      h 'h5', 'Display mode'
      h 'div.pt-vertical.pt-button-group.pt-align-left.pt-fill', opts
    ]
  update: (value)=>
    return if value == @props.value
    @props.update activeMode: {$set: value}

class SettingsPanel extends Component
  render: ->
    body = []
    if @props.settingsPanelIsActive
      body = [
        h 'div#settings', {key: 'settings'}, [
          h 'h2', 'Settings'
          h ModeControl, @props
        ]
      ]

    props = {
      transitionName: "settings"
      transitionEnterTimeout: 1000
      transitionLeaveTimeout: 1000
    }
    h CSSTransition, props, body

module.exports = SettingsPanel
