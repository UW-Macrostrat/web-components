import h from 'react-hyperscript'
import {NavLink, withRouter} from 'react-router-dom'
import {Button, AnchorButton} from '@blueprintjs/core'
import classNames from 'classnames'

# Button that forms a React Router link
LinkButton = withRouter (props)->
  {to, history, staticContext, onClick, match, location, rest...} = props

  onClick = (event)->
    return unless to?
    history.push(to)
    event.preventDefault()

  h AnchorButton, {onClick, rest...}

NavLinkButton = (props)->
  {className, rest...} = props
  className = classNames className, "bp3-button bp3-minimal"
  h NavLink, {className, rest...}

export {LinkButton, NavLinkButton}
