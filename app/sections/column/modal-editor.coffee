{findDOMNode} = require 'react-dom'
{Component, createElement} = require 'react'
{Dialog, Button, Intent, ButtonGroup, Alert} = require '@blueprintjs/core'
{FaciesDescriptionSmall} = require '../facies-descriptions'
h = require 'react-hyperscript'
d3 = require 'd3'
fmt = d3.format('.1f')

class ModalEditor extends Component
  constructor: (props)->
    super props
    @state = {facies: [], isAlertOpen: false}
  render: ->
    {interval, height, section} = @props
    return null unless interval?
    {id, top, bottom, facies} = interval
    hgt = fmt(height)
    h Dialog, {
      title: "Section #{section}: #{bottom} - #{top} m"
      isOpen: @props.isOpen
      onClose: @props.closeDialog
      style: {top: '10%'}
    }, [
      h 'div', {className:"pt-dialog-body"}, [
        h FaciesDescriptionSmall, {
          options: {isEditable: true}
          onClick: @selectFacies
          selected: facies
        }
        h 'div', [
          h 'h5', "Interval"
          h 'div.pt-button-group.pt-vertical', [
            h Button, {
              onClick: =>
                return unless @props.addInterval?
                @props.addInterval(height)
            }, "Add interval starting at #{fmt(height)} m"
            h Button, {
              onClick: =>
                @setState {isAlertOpen: true}
              intent: Intent.DANGER}, "Remove interval starting at #{bottom} m"
            h Alert, {
                iconName: "trash"
                intent: Intent.PRIMARY
                isOpen: @state.isAlertOpen
                confirmButtonText: "Delete interval"
                cancelButtonText: "Cancel"
                onConfirm: =>
                  @setState {isAlertOpen: false}
                  return unless @props.removeInterval?
                  @props.removeInterval(id)
                onCancel: => @setState {isAlertOpen: false}
            }, [
              h 'p', "Are you sure you want to delete the interval
                      beginning at #{hgt} m?"
            ]
          ]
        ]
      ]
    ]
  selectFacies: (facies)=>
    {onSelectFacies:o, interval} = @props
    return unless o?
    selected = facies.id
    if selected == interval.facies
      selected = null
    o(interval, selected)

module.exports = {ModalEditor}
