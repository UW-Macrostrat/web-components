import h from 'react-hyperscript'
import {NavLink} from 'react-router-dom'
import classNames from 'classnames'

LinkButton = (props)->
  {to, className, children, minimal, rest...} = props
  minimal ?= false
  className = classNames className, {"bp3-minimal": minimal}, "link-button", "bp3-button"
  activeClassName = null #classNames className, "bp3-active"
  h NavLink, {to, className, activeClassName, rest...}, children

export {LinkButton}
