import h from '~/hyper'
import {Switch, Button} from '@blueprintjs/core'
import {Component} from 'react'
import {Panel} from '~/src/ui'

Control = ({title, children})->
  h 'label.bp3-label', [
    title
    h Switch
  ]

SettingsPanel = (props)->
  {
    inEditMode,
    generalized,
    updateState,
    resetDemoData,
    rest...
  } = props

  toggle = (key)-> ->
    updateState {$toggle: [key]}

  h Panel, {
    className: 'settings-panel'
    title: "Settings"
    rest...
  }, [
    h 'form', [
      h Switch, {label: 'Edit mode', checked: inEditMode, onChange: toggle('inEditMode')}
      h Switch, {label: 'Generalized', checked: generalized, onChange: toggle('generalized')}
      h Button, {onClick: resetDemoData, disabled: not resetDemoData?}, "Reset demo"
    ]
  ]

export {SettingsPanel}
