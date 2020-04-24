/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This should eventually come from the @macrostrat/ui-components repository

import {createContext, useContext, useState, useEffect} from 'react';
import update from 'immutability-helper';
import h from 'react-hyperscript';
import T from 'prop-types';

const ModelEditorContext = createContext(null);

const ModelEditorProvider = function(props){
  /*
  Context to assist with editing a model
  */
  let {
    model,
    logUpdates,
    children,
    alwaysConfirm
  } = props;

  console.warn(`Using the ModelEditorContext from
    @macrostrat/column-components is deprecated.
    Please use the equivalent class from
    @macrostrat/ui-components instead.`)

  if (logUpdates == null) { logUpdates = false; }
  if (alwaysConfirm == null) { alwaysConfirm = false; }
  const [editedModel, setState] = useState(model);

  const confirmChanges = () => props.onConfirmChanges(editedModel);

  const revertChanges = function() {
    if (alwaysConfirm) {
      console.log("Confirming model changes");
      confirmChanges();
    }
    return setState(model);
  };
  // Zero out edited model when model prop changes

  useEffect(revertChanges, [model]);

  const updateModel = function(spec){
    const v = update(editedModel, spec);
    if (logUpdates) {
      console.log(v);
    }
    return setState(v);
  };

  const deleteModel = function() {
    setState(null);
    return props.onDelete(model);
  };

  const hasChanges = () => model === editedModel;

  const value = {
    model, editedModel, updateModel,
    deleteModel, hasChanges,
    revertChanges, confirmChanges
  };
  return h(ModelEditorContext.Provider, {value}, children);
};

ModelEditorProvider.propTypes = {
  onConfirmChanges: T.func.isRequired,
  onDelete: T.func.isRequired
};

const useModelEditor = () => useContext(ModelEditorContext);

export {ModelEditorProvider, ModelEditorContext, useModelEditor};
