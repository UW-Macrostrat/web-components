import h from 'react-hyperscript'
import {Button, Intent, Spinner} from '@blueprintjs/core'
import classNames from 'classnames'

SaveButton = (props)->
  {className, inProgress, disabled, rest...} = props
  className = classNames(className, 'save-button')
  icon = 'floppy-disk'
  if inProgress
    icon = h Spinner, {size: 20}
    disabled = true

  h Button, {
    icon
    intent: Intent.SUCCESS
    className
    disabled
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
