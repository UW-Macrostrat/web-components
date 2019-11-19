import {Component, createContext, useContext} from 'react'
import h from 'react-hyperscript'
import {DateInput} from '@blueprintjs/datetime'
import {EditableText} from '@blueprintjs/core'
import {EditButton, DeleteButton} from './buttons'
import {StatefulComponent} from './stateful'
import classNames from 'classnames'
import T from 'prop-types'

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
  @defaultProps: {
    canEdit: true
  }
  @propTypes: {
    model: T.object.isRequired
    persistChanges: T.func
  }
  constructor: (props)->
    super props
    @state = {
      isEditing: props.isEditing or false
      isPersisting: null
      error: null
      model: props.model
      initialModel: props.model
    }

  render: ->
    {model} = @state
    {canEdit} = @props
    isEditing = @state.isEditing and canEdit
    actions = do => {onChange, toggleEditing, updateState, onPersistChanges} = @
    value = {actions, model, isEditing, canEdit, hasChanges: @hasChanges}
    h ModelEditorContext.Provider, {value}, @props.children

  getValue: (field)=> @state.model[field]

  hasChanges: (field)=>
    if not field?
      return @props.model != @state.model
    return @props.model[field] != @state.model[field]

  onChange: (field)=>(value)=>
    @updateState {model: {[field]: {$set: value}}}

  toggleEditing: =>
    spec = {$toggle: ['isEditing']}
    if @state.isEditing
      spec.model = {$set: @state.initialModel}
    @updateState spec

  onPersistChanges: =>
    @persistChanges()

  persistChanges: =>
    {persistChanges} = @props
    # Persist changes expects a promise
    ret = null
    return null unless persistChanges?
    try
      @updateState {isPersisting: {$set: true}}

      # Compute a shallow changeset of the model fields
      changeset = {}
      for k,v of @state.model
        continue if v == @state.initialModel[k]
        changeset[k] = v

      ret = await persistChanges(@state.model, changeset)
    catch err
      console.error err
    finally
      spec = {isPersisting: {$set: false}}
      if ret? and Object.isObject(ret)
         spec.model = {$merge: ret}
      @updateState spec

  componentDidUpdate: (prevProps)->
    return unless prevProps?
    return if prevProps == @props
    spec = {}
    if @props.isEditing != prevProps.isEditing and @props.isEditing != @state.isEditing
      spec.isEditing = {$set: @props.isEditing}
    if @props.model != prevProps.model
      spec.initialModel = {$set: @props.model}
    @updateState spec

class EditableMultilineText extends Component
  @contextType: ModelEditorContext
  render: ->
    {field, className} = @props
    {actions, model, isEditing} =  @context
    value = model[field]
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
    {actions, model, isEditing} = @context
    value = model[field]
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

useModelEditor = ->
  useContext(ModelEditorContext)

export {
  ModelEditor,
  ModelEditorContext,
  ModelEditButton,
  EditableMultilineText,
  EditableDateField
  useModelEditor
}
