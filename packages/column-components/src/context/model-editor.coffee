# This should eventually come from the @macrostrat/ui-components repository

import {createContext, useContext, useState, useEffect} from 'react'
import update from 'immutability-helper'
import h from 'react-hyperscript'
import T from 'prop-types'

ModelEditorContext = createContext(null)

ModelEditorProvider = (props)->
  ###
  Context to assist with editing a model
  ###
  {
    model,
    logUpdates,
    children,
    alwaysConfirm
  } = props

  logUpdates ?= false
  alwaysConfirm ?= false
  [editedModel, setState] = useState({model...})

  confirmChanges = ->
    props.onConfirmChanges(editedModel)

  revertChanges = ->
    if alwaysConfirm
      console.log "Confirming model changes"
      confirmChanges()
    setState({model...})
  # Zero out edited model when model prop changes

  useEffect(revertChanges, [model])

  updateModel = (spec)->
    v = update(editedModel, spec)
    if logUpdates
      console.log(v)
    setState(v)

  deleteModel = ->
    props.onDelete(model)

  hasChanges = ->
    model == editedModel

  value = {
    model, editedModel, updateModel,
    deleteModel, hasChanges,
    revertChanges, confirmChanges
  }
  h ModelEditorContext.Provider, {value}, children

ModelEditorProvider.propTypes = {
  onConfirmChanges: T.func.isRequired
  onDelete: T.func.isRequired
}

useModelEditor = ->
  useContext(ModelEditorContext)

export {ModelEditorProvider, ModelEditorContext, useModelEditor}
