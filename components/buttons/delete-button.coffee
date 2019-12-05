import {Component} from 'react'
import h from 'react-hyperscript'
import {Intent, Button, Alert} from '@blueprintjs/core'

class DeleteButton extends Component
  @defaultProps: {
    handleDelete: ->
    alertContent: null
    itemDescription: "this item"
  }
  constructor: (props)->
    super props
    @state = {alertIsShown: false}

  render: ->
    {handleDelete, alertContent, itemDescription, rest...} = @props
    {alertIsShown} = @state

    alertContent = [
      "Are you sure you want to delete "
      itemDescription
      "?"
    ]

    onCancel = =>
      @setState {alertIsShown: false}

    onClick = =>
      @setState {alertIsShown: true}

    intent = Intent.DANGER
    icon = 'trash'

    h [
      h Button, {onClick, icon, intent, rest...}
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
    ]

export {DeleteButton}
