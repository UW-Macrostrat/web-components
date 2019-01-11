import {Component} from 'react'
import h from 'react-hyperscript'
import {Intent, Button, Alert} from '@blueprintjs/core'

class DeleteButton extends Component
  @defaultProps: {
    handleDelete: ->
    alertContent: "Are you sure you want to delete this item?"
  }
  constructor: (props)->
    super props
    @state = {alertIsShown: false}

  render: ->
    {handleDelete, alertContent, rest...} = @props
    {alertIsShown} = @state

    onCancel = =>
      @setState {alertIsShown: false}

    onClick = =>
      @setState {alertIsShown: true}

    intent = Intent.DANGER
    icon = 'trash'

    h 'div.delete-control', [
      h Alert, {
        isOpen: alertIsShown
        cancelButtonText: 'Cancel'
        confirmButtonText: 'Delete'
        icon
        intent
        onCancel
        onConfirm: =>
          handleDelete()
          onCancel()
      }, alertContent
      h Button, {onClick, icon, intent, rest...}
    ]

export {DeleteButton}
