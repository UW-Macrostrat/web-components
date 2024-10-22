import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import update from "immutability-helper";
import h from "@macrostrat/hyper";
import T from "prop-types";

const ModelEditorContext = createContext(null);

const ModelEditorProvider = function (props) {
  /*
  Context to assist with editing a model
  */
  let { model, logUpdates = false, children, alwaysConfirm = false } = props;

  console.warn(`Using the ModelEditorContext from
    @macrostrat/column-components is deprecated.
    Please use the equivalent class from
    @macrostrat/ui-components instead.`);

  const [editedModel, setState] = useState(model);
  // Our model can be initially null, but we want the edited model
  // to take on the first non-null value
  const confirmChanges = () => props.onConfirmChanges(editedModel);

  // Zero out edited model when model prop changes

  const revertChanges = useCallback(() => {
    if (model == editedModel) return;
    if (alwaysConfirm && editedModel != null) {
      console.log("Confirming model changes");
      confirmChanges();
    }
    setState(model);
  }, [model]);

  useEffect(() => {
    revertChanges();
  }, [model]);

  const updateModel = useCallback(
    function (spec) {
      const v = update(editedModel, spec);
      if (logUpdates) {
        console.log(v);
      }
      return setState(v);
    },
    [logUpdates, editedModel]
  );

  const deleteModel = function () {
    setState(null);
    return props.onDelete(model);
  };

  const hasChanges = () => model === editedModel;

  const value = {
    model,
    editedModel,
    updateModel,
    deleteModel,
    hasChanges,
    revertChanges,
    confirmChanges,
  };
  return h(ModelEditorContext.Provider, { value }, children);
};

ModelEditorProvider.propTypes = {
  onConfirmChanges: T.func.isRequired,
  onDelete: T.func.isRequired,
};

const useModelEditor = () => useContext(ModelEditorContext);

export { ModelEditorProvider, ModelEditorContext, useModelEditor };
