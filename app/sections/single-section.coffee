import {findDOMNode} from "react-dom"
import {Component} from "react"
import "./main.styl"
import {select} from "d3-selection"
import h from "react-hyperscript"
import {NavLink} from "../nav"
import {Icon} from "react-fa"
import {SettingsPanel} from "./settings"
import update from "immutability-helper"
import LocalStorage from "./storage"
import {getSectionData} from "./section-data"
Measure = require('react-measure').default
import {SectionComponent} from "./column"
import {PlatformConsumer} from "../platform"
import PropTypes from "prop-types"
import { Hotkey, Hotkeys, HotkeysTarget, Intent} from "@blueprintjs/core"
import {SectionNavigationControl} from "./util"
import {Notification} from "../notify"

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      dimensions: {}
      options:
        zoom: 1
        settingsPanelIsActive: false
        modes: [
          {value: 'normal', label: 'Normal'}
          {value: 'skeleton', label: 'Skeleton'}
          #{value: 'sequence-stratigraphy', label: 'Sequence Strat.'}
        ]
        activeMode: 'normal'
        displayModes: [
          {value: 'image', label: 'Full-resolution'}
          {value: 'generalized', label: 'Generalized'}
        ]
        activeDisplayMode: 'image'
        showNotes: true
        showSymbols: true
        showFacies: true
        showFloodingSurfaces: false
        showTriangleBars: false
        # Allows us to test the serialized query mode
        # we are developing for the web
        serializedQueries: global.SERIALIZED_QUERIES
        dragdealer: false
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        showCarbonIsotopes: false
        dragPosition: {x: 500, y: 500}

    @optionsStorage = new LocalStorage 'sections-component'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

  getChildContext: ->
    inEditMode: @state.options.inEditMode

  @childContextTypes:
    inEditMode: PropTypes.bool

  render: ->
    console.log @props, @state

    resizeFunc = (contentRect)->
      @setState dimensions: contentRect

    {section, height} = @props
    {inEditMode} = @state.options

    scrollToHeight = height

    # Set up routing to jump to a specific height
    obj = {
      bounds: true,
      offset: true,
      scroll: true,
      client: true,
      onResize: resizeFunc
    }

    key = section.id # Because react
    skeletal = @state.options.activeMode == 'skeleton'
    {options} = @state
    options.zoom = 1

    {toggleSettings} = @
    h 'div.page.section-page.single-section', [
      h 'div.panel-container', [
        h SectionNavigationControl, {toggleSettings}
        h PlatformConsumer, null, ({inEditMode})=>
          h SectionComponent, {
            trackVisibility: false
            section...,
            scrollToHeight,
            offsetTop: 0
            onResize: @onResize
            key, skeletal,
            isEditable: inEditMode
            useRelativePositioning: false
            options...
          }
      ]
      h SettingsPanel, @state.options
    ]

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

export default SectionPage


