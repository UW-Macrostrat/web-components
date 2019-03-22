import h from 'react-hyperscript'
import {Link} from 'react-router-dom'
import {Card} from '@blueprintjs/core'

LinkCard = (props)->
  {to, href, target, rest...} = props
  className = "link-card"
  inner = h Card, {rest...}
  if not to?
    return h 'a', {href, target, className}, inner
  h Link, {to, className}, inner

export {LinkCard}
