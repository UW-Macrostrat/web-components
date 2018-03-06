{findDOMNode} = require 'react-dom'
{Component, createElement} = require 'react'
{Dialog, Button, Intent, ButtonGroup, Alert} = require '@blueprintjs/core'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{PickerControl} = require '../settings'
{grainSizes} = require './grainsize'
h = require 'react-hyperscript'
d3 = require 'd3'
fmt = d3.format('.1f')

floodingSurfaceOrders = [-1,-2,-3,-4,-5,null,5,4,3,2,1]

class ModalEditor extends Component
  @defaultProps: {onUpdate: ->}
  constructor: (props)->
    super props
    @state = {
      facies: [],
      isAlertOpen: false
    }
  render: ->
    {interval, height, section} = @props
    return null unless interval?
    console.log interval
    {id, top, bottom, facies} = interval
    hgt = fmt(height)
    h Dialog, {
      title: "Section #{section}: #{bottom} - #{top} m"
      isOpen: @props.isOpen
      onClose: @props.closeDialog
      style: {top: '10%'}
    }, [
      h 'div', {className:"pt-dialog-body"}, [
        h 'h3', [
          "ID "
          h 'code', interval.id
        ]
        h FaciesDescriptionSmall, {
          options: {isEditable: true}
          onClick: @selectFacies
          selected: facies
        }
        h 'label.pt-label', [
          'Grainsize'
          h PickerControl, {
            vertical: false,
            isNullable: true,
            states: grainSizes.map (d)->
              {label: d, value: d}
            activeState: interval.grainsize
            onUpdate: @selectGrainSize
          }
        ]
        h 'label.pt-label', [
          'Flooding surface (negative is regression)'
          h PickerControl, {
            vertical: false,
            isNullable: true,
            states: floodingSurfaceOrders.map (d)->
              lbl = "#{d}"
              lbl = 'None' if not d?
              {label: d, value: d}
            activeState: interval.flooding_surface_order
            onUpdate: @selectFloodingSurfaceOrder
          }
        ]
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
    await o(interval, selected)
    @props.onUpdate()

  selectFloodingSurfaceOrder: (fso)=>
    {onSelectFloodingSurfaceOrder:o, interval} = @props
    return unless o?
    await o(interval, fso)
    @props.onUpdate()

  selectGrainSize: (grainsize)=>
    {onSelectGrainSize:o, interval} = @props
    return unless o?
    await o(interval, grainsize)
    @props.onUpdate()

module.exports = {ModalEditor}
