{Component} = require 'react'
h = require 'react-hyperscript'
{CSSTransition} = require 'react-transition-group'
{Switch} = require '@blueprintjs/core'
{format} = require 'd3'
{PlatformConsumer} = require '../platform'
{FaciesDescriptionSmall} = require './facies-descriptions'
classNames = require 'classnames'

require './settings.styl'


class PickerControl extends Component
  @defaultProps: {
    states : [
      {label: 'State 1', value: 'state1'}
      {label: 'State 2', value: 'state2'}
    ]
    vertical: true
    isNullable: false
  }
  render: ->
    {states, activeState, vertical} = @props
    className = classNames('pt-button-group', 'pt-fill', {
      'pt-vertical': vertical
      'pt-align-left': vertical
    })

    h 'div.picker-control', [
      h 'div', {className}, states.map (d)=>
        className = classNames('pt-button', {
          'pt-active': @props.activeState == d.value
        })
        h 'button', {
          type: 'button'
          className
          onClick: @onUpdate(d.value)
        }, d.label
    ]
  onUpdate: (value)=> =>
    if value == @props.activeState
      return unless @props.isNullable
      value = null
    return unless @props.onUpdate?
    @props.onUpdate(value)

fmt = format('.2f')

EditModeControl = (props)->
  h PlatformConsumer, null, ({WEB, inEditMode, updateState})->
    h Switch, {
      checked: inEditMode
      label: 'Allow editing'
      key: 'edit-mode'
      onChange: -> updateState {inEditMode: not inEditMode}
    }

SerializedQueriesControl = (props)->
  h PlatformConsumer, null, ({WEB, serializedQueries, updateState})->
    return null if WEB
    h Switch, {
      checked: serializedQueries
      label: 'Serialized queries'
      key: 'serialized-queries'
      onChange: -> updateState {serializedQueries: not serializedQueries}
    }

class SettingsPanel extends Component
  render: ->
    return null unless @props.settingsPanelIsActive
    h CSSTransition, {
      classNames: "settings"
      timeout: {exit: 1000, enter: 1000}
    }, [
      h 'div#settings', {key: 'settings'}, [
        h 'h2', 'Settings'
        h 'hr'
        @renderControls()...
      ]
    ]

  viewParams: =>
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

  renderControls: =>
    return [
      h 'h5', "Components"
      @createSwitch 'showCarbonIsotopes', "Carbon isotopes"
      @createSwitch 'showFacies', "Facies"
      @createSwitch 'showSymbols', 'Symbols'
      @createSwitch 'showNotes', "Notes"
      @createPicker 'displayModes', 'activeDisplayMode'
      h 'hr'
      h 'h5', 'Sequence stratigraphy'
      @createSwitch 'showFloodingSurfaces', "Flooding surfaces"
      @createSwitch 'showTriangleBars', "Triangle bars"
      h 'hr'
      @debuggingControls()...
      h 'h6', 'Display mode'
      @createPicker 'modes', 'activeMode'
    ]

  debuggingControls: ->
    return [
      h 'h5', "Backend"
      h EditModeControl
      h SerializedQueriesControl
      h 'hr'
    ]

  createSwitch: (id, label)=>
    h Switch, {
      checked: @props[id]
      label: label
      key: id
      onChange: @switchHandler(id)
    }

  switchHandler: (name)=> =>
    v = {}
    v[name] = {$apply: (d)->not d}
    @props.update v

  createPicker: (modes, active)=>
    onUpdate = (value)=>
      v = {}
      v[active] = {$set: value}
      @props.update v

    h PickerControl, {
      states: @props[modes]
      activeState: @props[active]
      onUpdate
    }

module.exports = {PickerControl, SettingsPanel}
