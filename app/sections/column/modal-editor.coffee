{findDOMNode} = require 'react-dom'
{Component, createElement} = require 'react'
{Dialog, Button, Intent} = require '@blueprintjs/core'
{FaciesDescriptionSmall} = require '../facies-descriptions'
h = require 'react-hyperscript'
d3 = require 'd3'
fmt = d3.format('.1f')

class ModalEditor extends Component
  constructor: (props)->
    super props
    @state = {facies: []}
  render: ->
    {interval} = @props
    return null unless interval?
    {id, top, bottom, facies} = interval
    h Dialog, {
      title: "Interval #{id}: #{bottom} - #{top} m"
      isOpen: @props.isOpen
      onClose: @props.closeDialog
    }, [
      h 'div', {className:"pt-dialog-body"}, [
        h FaciesDescriptionSmall, {
          options: {isEditable: true}
          onClick: @selectFacies
          selected: facies
        }
      ]
      h 'div', {className:"pt-dialog-footer"}, [
        h 'div', {className: "pt-dialog-footer-actions"}, [
          h Button, {
            text: "Cancel"
            intent: Intent.DANGER
          }
          h Button, {
            intent: Intent.PRIMARY
            onClick: @props.closeDialog
            text: "Select"
          }
        ]
      ]
    ]
  selectFacies: =>

module.exports = {ModalEditor}
