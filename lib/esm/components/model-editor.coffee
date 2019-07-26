import { createContext, Component } from 'react';
import h from 'react-hyperscript';
import { EditableText } from '@blueprintjs/core';
import classNames from 'classnames';
import { EditButton } from './buttons/index.coffee';
import { DateInput } from '@blueprintjs/datetime';
import { StatefulComponent } from './stateful.coffee';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';

var EditableDateField, EditableField, ModelEditButton, ModelEditor, ModelEditorContext,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

ModelEditorContext = createContext({});

ModelEditButton = (function() {
  class ModelEditButton extends Component {
    render() {
      var actions, isEditing;
      ({isEditing, actions} = this.context);
      return h(EditButton, {
        isEditing,
        onClick: actions.toggleEditing,
        ...this.props
      });
    }

  }
  ModelEditButton.contextType = ModelEditorContext;

  return ModelEditButton;

}).call(undefined);

ModelEditor = (function() {
  class ModelEditor extends StatefulComponent {
    constructor(props) {
      super(props);
      this.getValue = this.getValue.bind(this);
      this.hasChanges = this.hasChanges.bind(this);
      this.onChange = this.onChange.bind(this);
      this.toggleEditing = this.toggleEditing.bind(this);
      this.state = {
        isEditing: false,
        error: null,
        data: props.data,
        initialData: props.data
      };
    }

    render() {
      var actions, data, isEditing, value;
      ({data, isEditing} = this.state);
      actions = (() => {
        var onChange, toggleEditing, updateState;
        return ({onChange, toggleEditing, updateState} = this);
      })();
      value = {
        actions,
        data,
        isEditing,
        hasChanges: this.hasChanges
      };
      console.log(value);
      return h(ModelEditorContext.Provider, {value}, this.props.children);
    }

    getValue(field) {
      boundMethodCheck(this, ModelEditor);
      return this.state.data[field];
    }

    hasChanges() {
      boundMethodCheck(this, ModelEditor);
      return this.props.data !== this.state.data;
    }

    onChange(field) {
      boundMethodCheck(this, ModelEditor);
      return (value) => {
        var data;
        data = {};
        data[field] = {
          $set: value
        };
        return this.updateState({data});
      };
    }

    toggleEditing() {
      boundMethodCheck(this, ModelEditor);
      return this.updateState({
        $toggle: ['isEditing']
      });
    }

    componentDidUpdate(prevProps) {
      if (this.props.data !== prevProps.data) {
        return this.updateState({
          initialData: {
            $set: this.props.data
          }
        });
      }
    }

  }
  ModelEditor.EditButton = ModelEditButton;

  return ModelEditor;

}).call(undefined);

EditableField = (function() {
  class EditableField extends Component {
    render() {
      var actions, className, data, field, isEditing, onChange, value;
      ({field, className} = this.props);
      ({actions, data, isEditing} = this.context);
      value = data[field];
      onChange = actions.onChange(field);
      className = classNames(className, `field-${field}`);
      if (isEditing) {
        value = h(EditableText, {
          placeholder: `Edit ${field}`,
          multiline: true,
          className,
          onChange,
          value
        });
      }
      return h('div.text', {className}, value);
    }

  }
  EditableField.contextType = ModelEditorContext;

  return EditableField;

}).call(undefined);

EditableDateField = (function() {
  class EditableDateField extends Component {
    render() {
      var actions, data, field, isEditing, value;
      ({field} = this.props);
      ({actions, data, isEditing} = this.context);
      value = data[field];
      if (!isEditing) {
        return h('div.date-input.disabled', value);
      }
      return h(DateInput, {
        className: 'date-input',
        value: new Date(value),
        formatDate: (date) => {
          return date.toLocaleDateString();
        },
        placeholder: "MM/DD/YYYY",
        showActionsBar: true,
        onChange: actions.onChange(field),
        parseDate: function(d) {
          return new Date(d);
        }
      });
    }

  }
  EditableDateField.contextType = ModelEditorContext;

  return EditableDateField;

}).call(undefined);

export { EditableDateField, EditableField, ModelEditor, ModelEditorContext };
