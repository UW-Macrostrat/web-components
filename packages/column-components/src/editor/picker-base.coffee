import {Component} from "react"
import h from "react-hyperscript"
import {Switch, Slider, Button} from "@blueprintjs/core"
import classNames from "classnames"

class PickerControl extends Component
  @defaultProps: {
    states : [
      {label: 'State 1', value: 'state1'}
      {label: 'State 2', value: 'state2'}
    ]
    vertical: true
    isNullable: false
  }
  render: ->
    {states, activeState, vertical} = @props
    className = classNames('bp3-button-group', 'bp3-fill', {
      'bp3-vertical': vertical
      'bp3-align-left': vertical
    })

    h 'div.picker-control', [
      h 'div', {className}, states.map (d)=>
        className = classNames('bp3-button', {
          'bp3-active': @props.activeState == d.value
        })
        h 'button', {
          type: 'button'
          className
          onClick: @onUpdate(d.value)
        }, d.label
    ]
  onUpdate: (value)=> =>
    if value == @props.activeState
      return unless @props.isNullable
      value = null
    return unless @props.onUpdate?
    @props.onUpdate(value)

export {PickerControl}
