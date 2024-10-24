// @ts-nocheck
import { Component, createContext, ReactElement, useContext } from "react";
import h from "@macrostrat/hyper";
import { DateInput } from "@blueprintjs/datetime";
import { EditableText } from "@blueprintjs/core";
import { EditButton, DeleteButton } from "./buttons";
import { StatefulComponent } from "./util";
import classNames from "classnames";
import update, { Spec } from "immutability-helper";

import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";

const ModelEditorContext = createContext<any>({});

function ModelEditButton(props): ReactElement {
  const { isEditing, actions } = useContext(ModelEditorContext);
  return h(EditButton, {
    isEditing,
    onClick: actions.toggleEditing,
    ...props,
  });
}

interface ModelEditorProps<T> {
  model: T;
  canEdit: boolean;
  isEditing: boolean;
  persistChanges(v: T, spec: Spec<T>): void;
}

interface ModelEditorState<T> {
  isEditing: boolean;
  isPersisting: boolean | null;
  error: any | null;
  model: T;
  initialModel: T;
}

class ModelEditor<T> extends StatefulComponent<
  ModelEditorProps<T>,
  ModelEditorState<T>
> {
  static defaultProps = {
    canEdit: true,
  };
  constructor(props) {
    super(props);
    this.getValue = this.getValue.bind(this);
    this.hasChanges = this.hasChanges.bind(this);
    this.onChange = this.onChange.bind(this);
    this.toggleEditing = this.toggleEditing.bind(this);
    this.persistChanges = this.persistChanges.bind(this);
    this.onPersistChanges = this.onPersistChanges.bind(this);
    this.state = {
      isEditing: props.isEditing || false,
      isPersisting: null,
      error: null,
      model: props.model,
      initialModel: props.model,
    };
  }

  render(): ReactElement {
    const { model } = this.state;
    const { canEdit } = this.props;
    const isEditing = this.state.isEditing && canEdit;
    const actions = (() => {
      let onChange, persistChanges, toggleEditing, updateState;
      return ({ onChange, toggleEditing, updateState, persistChanges } = this);
    })();
    const value = {
      actions,
      model,
      isEditing,
      canEdit,
      hasChanges: this.hasChanges,
    };
    return h(ModelEditorContext.Provider, { value }, this.props.children);
  }

  getValue(field) {
    return this.state.model[field];
  }

  hasChanges(field) {
    if (field == null) {
      return this.state.initialModel !== this.state.model;
    }
    return this.state.initialModel[field] !== this.state.model[field];
  }

  onChange(field) {
    return (value) => {
      // @ts-ignore
      return this.updateState({ model: { [field]: { $set: value } } });
    };
  }

  toggleEditing() {
    const spec: any = { $toggle: ["isEditing"] };
    if (this.state.isEditing) {
      spec.model = { $set: this.state.initialModel };
    }
    return this.updateState(spec);
  }

  onPersistChanges() {
    return this.persistChanges(null);
  }

  async persistChanges(spec: any | undefined) {
    const { persistChanges } = this.props;
    // Persist changes expects a promise

    let updatedModel = this.state.model;
    if (spec != null) {
      // If changeset is provided, we need to integrate
      // it before proceeding
      console.log(spec);
      updatedModel = update(this.state.model, spec);
    }
    console.log(updatedModel);

    let ret = null;
    if (persistChanges == null) {
      return null;
    }
    try {
      this.updateState({ isPersisting: { $set: true } });

      // Compute a shallow changeset of the model fields
      const changeset: any = {};
      for (let k in updatedModel) {
        const v = updatedModel[k];
        if (v === this.state.initialModel[k]) {
          continue;
        }
        changeset[k] = v;
      }

      ret = await persistChanges(updatedModel, changeset);
    } catch (err) {
      console.error(err);
    } finally {
      spec = { isPersisting: { $set: false } };

      if (ret != null) {
        // @ts-ignore
        const newModel = update(this.state.initialModel, { $merge: ret });
        console.log(newModel);
        spec.model = { $set: newModel };
        spec.initialModel = { $set: newModel };
      }
      this.updateState(spec);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps == null) {
      return;
    }
    if (prevProps === this.props) {
      return;
    }
    const spec: any = {};
    if (
      this.props.isEditing !== prevProps.isEditing &&
      this.props.isEditing !== this.state.isEditing
    ) {
      spec.isEditing = { $set: this.props.isEditing };
    }
    if (this.props.model !== prevProps.model) {
      spec.initialModel = { $set: this.props.model };
      if (!this.props.isEditing) {
        // If we aren't in edit mode, we want to propagate changes into the model
        spec.model = { $set: this.props.model };
      }
    }
    return this.updateState(spec);
  }
}

function EditableMultilineText(props: any): React.ReactNode {
  let { field, className } = props;
  const { actions, model, isEditing } = useContext(ModelEditorContext);
  let value = model[field];
  const onChange = actions.onChange(field);
  className = classNames(className, `field-${field}`, {
    edited: useFieldHasChanges(field),
  });

  if (isEditing) {
    value = h(EditableText, {
      placeholder: `Edit ${field}`,
      multiline: true,
      className,
      onChange,
      value,
    });
  }
  return h("div.text", { className }, value);
}

const useFieldHasChanges = (field) => {
  const { hasChanges } = useContext(ModelEditorContext);
  return hasChanges(field);
};

class EditableDateField extends Component<any, any> {
  static contextType = ModelEditorContext;
  render() {
    const { field } = this.props;
    const { actions, model, isEditing } = this.context;
    const value = model[field];

    const className = classNames("date-input", {
      edited: this.context.hasChanges(field),
      disabled: !isEditing,
    });

    let valueText = value;
    if (value instanceof Date) {
      valueText = value.toLocaleDateString();
    }

    if (!isEditing) {
      return h("div", { className }, valueText);
    }
    return h(DateInput, {
      className,
      value: new Date(value),
      formatDate: (date) => date.toLocaleDateString(),
      placeholder: valueText ?? "Select date...",
      showActionsBar: true,
      onChange: actions.onChange(field),
      parseDate(d) {
        return new Date(d);
      },
    });
  }
}

const useModelEditor = () => useContext(ModelEditorContext);

export {
  ModelEditor,
  ModelEditorContext,
  ModelEditButton,
  EditableMultilineText,
  EditableDateField,
  useModelEditor,
};
