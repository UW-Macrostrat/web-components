# This component should be refactored into a shared UI component

import {Component} from 'react'
import h from 'react-hyperscript'
import {Button, Collapse} from '@blueprintjs/core'
import './main.styl'
import styled from '@emotion/styled'

HeaderButton = styled(Button)"""
.bp3-button-text {
  flex-grow: 1;
  display: flex;
}
.bp3-button-text * {
  display: inline;
}
span.expander {
  flex-grow: 1;
}
"""

class CollapsePanel extends Component
  @defaultProps: {
    title: "Panel"
    # `storageID` prop allows storage of state in
    # localStorage or equivalent.
    storageID: null
  }
  constructor: (props)->
    super props
    @state = {isOpen: false}

  componentWillMount: ->
    # Set open state from local storage if it is available
    {storageID} = @props
    return unless storageID?
    isOpen = @savedState()[storageID]
    return unless isOpen?
    @setState {isOpen}

  ###
  Next functions are for state management
  across pages, if storageID prop is passed
  ###
  savedState: ->
    try
      st = window.localStorage.getItem('collapse-panel-state')
      return JSON.parse(st) or {}
    catch
      return {}

  checkLocalStorage: ->
    # Set open state from local storage if it is available
    {storageID} = @props
    return unless storageID?
    isOpen = @savedState()[storageID] or null
    isOpen ?= false
    @setState {isOpen}

  componentDidUpdate: (prevProps, prevState)->
    # Refresh object in local storage
    {storageID} = @props
    return unless storageID?
    {isOpen} = @state
    return unless isOpen != prevState.isOpen
    s = @savedState()
    s[storageID] = isOpen
    j = JSON.stringify(s)
    window.localStorage.setItem('collapse-panel-state', j)

  render: ->
    {title, children, storageID, headerRight, props...} = @props
    {isOpen} = @state

    icon = if isOpen then 'collapse-all' else 'expand-all'
    onClick = => @setState {isOpen: not isOpen}

    headerRight ?= null

    h 'div.collapse-panel', props, [
      h 'div.panel-header', [
        h HeaderButton, {icon, minimal: true, onClick, fill: true}, [
          h 'h2', title
          h 'span.expander'
        ]
        headerRight
      ]
      h Collapse, {isOpen}, children
    ]

export {CollapsePanel}
