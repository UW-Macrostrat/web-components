import {Component} from "react"
import h from "react-hyperscript"
import {CSSTransition} from "react-transition-group"
import {Switch, Slider, Button} from "@blueprintjs/core"
import {format, select} from "d3"
import {PlatformConsumer} from "../platform"
import {SequenceStratConsumer} from "./sequence-strat-context"
import {FaciesDescriptionSmall} from "./facies-descriptions"
import classNames from "classnames"

import "./settings.styl"


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

SequenceStratControlPanel = (props)->
  h SequenceStratConsumer, null, (value)->
    {actions} = value
    h 'div', props, [
      h 'h5', 'Sequence stratigraphy'
      h Switch, {
        checked: value.showFloodingSurfaces
        label: "Flooding surfaces"
        onChange: actions.toggleBooleanState("showFloodingSurfaces")
      }
      h Switch, {
        checked: value.showTriangleBars
        label: "Triangle bars"
        onChange: actions.toggleBooleanState("showTriangleBars")
      }
      h Slider, {
        min: 0,
        max: 5,
        stepSize: 1,
        showTrackFill: false,
        value: value.sequenceStratOrder
        onChange: (v)->
          actions.updateState({sequenceStratOrder:v})
      }
      h 'hr'
    ]

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
      @sequenceStratControls()
      @debuggingControls()
      h 'h6', 'Display mode'
      @createPicker 'modes', 'activeMode'
    ]

  debuggingControls: ->
    h 'div', [
      h 'h5', "Backend"
      h EditModeControl
      h SerializedQueriesControl
      h Button, {onClick: @printToPDF}, "Print to PDF"
      h 'hr'
    ]

  printToPDF: ->
    console.log "Printing to PDF"
    {remote} = require 'electron'
    fs = require 'fs'
    path = require 'path'
    wc = remote.getCurrentWebContents()

    pixelsToMicrons = (px)->
      Math.ceil(px/96.0*25400)

    {width, height} = document.querySelector('#section-page-inner').getBoundingClientRect()
    width = 2400
    height = 1900

    opts = {
      printBackground: true
      marginsType: 1
      pageSize: {
        height: pixelsToMicrons(height*5)+10
        width: pixelsToMicrons(width*5)+10
      }
    }

    wc.printToPDF opts, (e, data)->
      dn = process.env.REPO_DIR
      outfile = path.join(dn, "graphics","output", "summary-sections.pdf")
      fs.writeFileSync outfile, data

  sequenceStratControls: ->
    return h SequenceStratControlPanel

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

export {PickerControl, SettingsPanel}
