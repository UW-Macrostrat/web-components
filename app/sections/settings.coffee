{Component} = require 'react'
h = require 'react-hyperscript'
CSSTransition = require 'react-addons-css-transition-group'
{Switch} = require '@blueprintjs/core'
{format} = require 'd3'

require './settings.styl'


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

    h 'div.mode-control', [
      h 'h5', 'Display mode'
      h 'div.pt-vertical.pt-button-group.pt-align-left.pt-fill', opts
    ]
  update: (value)=>
    return if value == @props.value
    @props.update activeMode: {$set: value}

fmt = format('.2f')

class SettingsPanel extends Component
  render: ->
    body = []
    if @props.settingsPanelIsActive
      body = [
        h 'div#settings', {key: 'settings'}, [
          h 'h2', 'Settings'
          h ModeControl, @props
          h Switch, {
            checked: @props.condensedDisplay
            label: "Condensed display"
            onChange: @switchHandler('condensedDisplay')
          }
          h Switch, {
            checked: @props.showNotes
            label: "Show notes"
            onChange: @switchHandler('showNotes')
          }
          h Switch, {
            checked: @props.inEditMode
            label: "Allow editing"
            onChange: @switchHandler('inEditMode')
          }
          h Switch, {
            checked: @props.dragdealer
            label: "Dragdealer"
            onChange: @switchHandler('dragdealer')
          }
          h 'div#view-params', [
            h 'h5', 'View info'
            h 'table.pt-table', [
              h 'tbody', [
                h 'tr', [
                  h 'td', 'Zoom'
                  h 'td', fmt(@props.zoom)
                ]
              ]
            ]
          ]
        ]
      ]

    props = {
      transitionName: "settings"
      transitionEnterTimeout: 1000
      transitionLeaveTimeout: 1000
    }
    h CSSTransition, props, body

  switchHandler: (name)=> =>
    v = {}
    v[name] = {$apply: (d)->not d}
    @props.update v

module.exports = SettingsPanel
