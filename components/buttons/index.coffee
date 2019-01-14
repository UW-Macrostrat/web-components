import h from 'react-hyperscript'
import {Button, Intent} from '@blueprintjs/core'

SaveButton = (props)->
  h Button, {
    icon: 'floppy-disk'
    intent: Intent.SUCCESS
    props...
  }

CancelButton = (props)->
  h Button, {
    intent: Intent.WARNING
    props...
  }

export {SaveButton, CancelButton}
export * from './delete-button'
