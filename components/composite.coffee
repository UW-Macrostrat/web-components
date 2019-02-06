import h from 'react-hyperscript'
import {Link} from 'react-router-dom'
import {Card} from '@blueprintjs/core'

LinkCard = (props)->
  {to, rest...} = props
  className = "link-card"
  h Link, {to, className}, (
    h Card, {rest...}
  )

export {LinkCard}
