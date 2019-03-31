import h from 'react-hyperscript'
import {NavLink, withRouter} from 'react-router-dom'
import {Button, AnchorButton} from '@blueprintjs/core'

# Button that forms a React Router link
LinkButton = withRouter (props)->
  {to, history, staticContext, onClick, rest...} = props

  onClick = (event)->
    return unless to?
    history.push(to)
    event.preventDefault()

  h AnchorButton, {onClick, rest...}

export {LinkButton}
