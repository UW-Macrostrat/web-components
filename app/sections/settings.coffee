{Component} = require 'react'
h = require 'react-hyperscript'
CSSTransition = require 'react-addons-css-transition-group'
require './settings.styl'

class SettingsPanel extends Component
  render: ->
    body = []
    if @props.active
      body = [
        h 'div#settings', {key: 'settings'}, [
          h 'h2', 'Settings'
        ]
      ]

    props = {
      transitionName: "settings"
      transitionEnterTimeout: 1000
      transitionLeaveTimeout: 1000
    }
    h CSSTransition, props, body

module.exports = SettingsPanel
