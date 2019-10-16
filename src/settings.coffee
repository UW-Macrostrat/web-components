import h from '~/hyper'
import {Switch} from '@blueprintjs/core'

Control = ({title, children})->
  h 'label.bp3-label', [
    title
    h Switch
  ]


SettingsPanel = (props)->
  h 'div.settings-panel', [
    h 'h1', 'Column renderer'
    h 'h3.author', 'Daven Quinn, 2019'
    h 'form', [
      h Control, {title: 'Edit mode'}, [
        h Switch
      ]
      h Control, {title: 'Generalized'}, [
        h Switch
      ]
    ]
  ]

export {SettingsPanel}
