import h from 'react-hyperscript'
import {Button, Intent} from '@blueprintjs/core'
import classNames from 'classnames'

SaveButton = (props)->
  {className, rest...} = props
  className = classNames(className, 'save-button')

  h Button, {
    icon: 'floppy-disk'
    intent: Intent.SUCCESS
    className
    rest...
  }

CancelButton = (props)->
  {className, rest...} = props
  className = classNames(className, 'cancel-button')

  h Button, {
    intent: Intent.WARNING
    className
    rest...
  }

export {SaveButton, CancelButton}
export * from './delete-button'
