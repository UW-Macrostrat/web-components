import h from '~/hyper'
import {Switch} from '@blueprintjs/core'
import {Component} from 'react'

Control = ({title, children})->
  h 'label.bp3-label', [
    title
    h Switch
  ]


SettingsPanel = (props)->
  {inEditMode, generalized, updateState} = props

  toggle = (key)-> ->
    updateState {$toggle: [key]}

  h 'div.settings-panel', [
    h 'form', [
      h Switch, {label: 'Edit mode', checked: inEditMode, onChange: toggle('inEditMode')}
      h Switch, {label: 'Generalized', checked: generalized, onChange: toggle('generalized')}
    ]
  ]

export {SettingsPanel}
