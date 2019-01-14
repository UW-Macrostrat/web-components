import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {EditableText} from '@blueprintjs/core'
import {EditButton, DeleteButton} from './buttons'
import {StatefulComponent} from './stateful'
import classNames from 'classnames'

ModelEditorContext = createContext {}

class ModelEditButton extends Component
  @contextType: ModelEditorContext
  render: ->
    {isEditing, actions} = @context
    h EditButton, {isEditing, onClick: actions.toggleEditing}

class ModelEditor extends StatefulComponent
  @EditButton: ModelEditButton
  constructor: (props)->
    super props
    @state = {
      isEditing: false
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

  hasChanges: =>
    @props.data != @state.data

  onChange: (field)=>(value)=>
    data = {}
    data[field] = {$set: value}
    @updateState {data}

  toggleEditing: =>
    @updateState {$toggle: ['isEditing']}

  componentDidUpdate: (prevProps)->
    if @props.data != prevProps.data
      @updateState {initialData: {$set: @props.data}}

class EditableField extends Component
  @contextType: ModelEditorContext
  render: ->
    {field} = @props
    {actions, data, isEditing} =  @context
    value = data[field]
    onChange = actions.onChange(field)

    if isEditing
      value = h EditableText, {
        placeholder: "Edit #{field}"
        multiline: true
        onChange
        value
      }
    return h 'div.text', null, value


export {ModelEditor, EditableField}

