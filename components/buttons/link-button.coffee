import h from 'react-hyperscript'
import {NavLink} from 'react-router-dom'
import classNames from 'classnames'

LinkButton = (props)->
  {to, className, children, rest...} = props
  className = classNames className, "link-button", "bp3-button", "bp3-minimal"
  activeClassName = classNames className, "bp3-active"
  h NavLink, {to, className, activeClassName, rest...}, children

export {LinkButton}
