import h from 'react-hyperscript'
import {Link} from 'react-router-dom'
import classNames from 'classnames'

LinkCard = (props)->
  {to, href, className, elevation, rest...} = props
  elevation ?= 0

  className = classNames(
    "link-card",
    "bp3-card",
    "bp3-elevation-#{elevation}",
    className)

  if not to?
    return h 'a', {href, className, rest...}
  h Link, {to, className, rest...}

export {LinkCard}
