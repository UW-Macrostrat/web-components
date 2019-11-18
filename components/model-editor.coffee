import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {DateInput} from '@blueprintjs/datetime'
import {EditableText} from '@blueprintjs/core'
import {EditButton, DeleteButton} from './buttons'
import {StatefulComponent} from './stateful'
import classNames from 'classnames'

import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'

ModelEditorContext = createContext {}

class ModelEditButton extends Component
  @contextType: ModelEditorContext
  render: ->
    {isEditing, actions} = @context
    h EditButton, {
      isEditing
      onClick: actions.toggleEditing
      ...@props
    }

class ModelEditor extends StatefulComponent
  @EditButton: ModelEditButton
  constructor: (props)->
    super props
    @state = {
      isEditing: props.isEditing or false
      error: null
      data: props.data
      initialData: props.data
    }

  render: ->
    {data, isEditing} = @state
    actions = do => {onChange, toggleEditing, updateState} = @
    value = {actions, data, isEditing, hasChanges: @hasChanges}
    console.log value
    h ModelEditorContext.Provider, {value}, @props.children

  getValue: (field)=> @state.data[field]

  hasChanges: (field)=>
    if not field?
      return @props.data != @state.data
    return @props.data[field] != @state.data[field]

  onChange: (field)=>(value)=>
    data = {}
    data[field] = {$set: value}
    @updateState {data}

  toggleEditing: =>
    @updateState {$toggle: ['isEditing']}

  componentDidUpdate: (prevProps)->
    spec = {}
    if @props.isEditing != prevProps.isEditing
      spec.isEditing = {$set: @props.isEditing}
    if @props.data != prevProps.data
      spec.initialData = {$set: @props.data}
    @updateState spec

class EditableMultilineText extends Component
  @contextType: ModelEditorContext
  render: ->
    {field, className} = @props
    {actions, data, isEditing} =  @context
    value = data[field]
    onChange = actions.onChange(field)
    className = classNames className, "field-#{field}"

    if isEditing
      value = h EditableText, {
        placeholder: "Edit #{field}"
        multiline: true
        className
        onChange
        value
      }
    return h 'div.text', {className}, value

class EditableDateField extends Component
  @contextType: ModelEditorContext
  render: ->
    {field} = @props
    {actions, data, isEditing} = @context
    value = data[field]
    if not isEditing
      return h 'div.date-input.disabled', value
    h DateInput, {
      className: 'date-input'
      value: new Date(value)
      formatDate: (date) => date.toLocaleDateString(),
      placeholder: "MM/DD/YYYY"
      showActionsBar: true
      onChange: actions.onChange(field)
      parseDate: (d)->new Date(d)
    }


export {
  ModelEditor,
  ModelEditorContext,
  ModelEditButton,
  EditableMultilineText,
  EditableDateField
}
