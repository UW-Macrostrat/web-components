import { inherits as _inherits, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, createClass as _createClass, objectSpread2 as _objectSpread2, assertThisInitialized as _assertThisInitialized } from '../_virtual/_rollupPluginBabelHelpers.js';
import { createContext, Component } from 'react';
import h from 'react-hyperscript';
import { EditableText } from '@blueprintjs/core';
import classNames from 'classnames';
import { EditButton } from './buttons/index.js';
import { DateInput } from '@blueprintjs/datetime';
import { StatefulComponent } from './stateful.js';

var EditableDateField,
    EditableField,
    ModelEditButton,
    ModelEditor,
    ModelEditorContext,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
ModelEditorContext = createContext({});

ModelEditButton = function () {
  var ModelEditButton =
  /*#__PURE__*/
  function (_Component) {
    _inherits(ModelEditButton, _Component);

    function ModelEditButton() {
      _classCallCheck(this, ModelEditButton);

      return _possibleConstructorReturn(this, _getPrototypeOf(ModelEditButton).apply(this, arguments));
    }

    _createClass(ModelEditButton, [{
      key: "render",
      value: function render() {
        var actions, isEditing;
        var _this$context = this.context;
        isEditing = _this$context.isEditing;
        actions = _this$context.actions;
        return h(EditButton, _objectSpread2({
          isEditing: isEditing,
          onClick: actions.toggleEditing
        }, this.props));
      }
    }]);

    return ModelEditButton;
  }(Component);
  ModelEditButton.contextType = ModelEditorContext;
  return ModelEditButton;
}.call(undefined);

ModelEditor = function () {
  var ModelEditor =
  /*#__PURE__*/
  function (_StatefulComponent) {
    _inherits(ModelEditor, _StatefulComponent);

    function ModelEditor(props) {
      var _this;

      _classCallCheck(this, ModelEditor);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ModelEditor).call(this, props));
      _this.getValue = _this.getValue.bind(_assertThisInitialized(_this));
      _this.hasChanges = _this.hasChanges.bind(_assertThisInitialized(_this));
      _this.onChange = _this.onChange.bind(_assertThisInitialized(_this));
      _this.toggleEditing = _this.toggleEditing.bind(_assertThisInitialized(_this));
      _this.state = {
        isEditing: false,
        error: null,
        data: props.data,
        initialData: props.data
      };
      return _this;
    }

    _createClass(ModelEditor, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var actions, data, isEditing, value;
        var _this$state = this.state;
        data = _this$state.data;
        isEditing = _this$state.isEditing;

        actions = function () {
          var _this3;

          var onChange, toggleEditing, updateState;
          return _this3 = _this2, onChange = _this3.onChange, toggleEditing = _this3.toggleEditing, updateState = _this3.updateState, _this3;
        }();

        value = {
          actions: actions,
          data: data,
          isEditing: isEditing,
          hasChanges: this.hasChanges
        };
        console.log(value);
        return h(ModelEditorContext.Provider, {
          value: value
        }, this.props.children);
      }
    }, {
      key: "getValue",
      value: function getValue(field) {
        boundMethodCheck(this, ModelEditor);
        return this.state.data[field];
      }
    }, {
      key: "hasChanges",
      value: function hasChanges() {
        boundMethodCheck(this, ModelEditor);
        return this.props.data !== this.state.data;
      }
    }, {
      key: "onChange",
      value: function onChange(field) {
        var _this4 = this;

        boundMethodCheck(this, ModelEditor);
        return function (value) {
          var data;
          data = {};
          data[field] = {
            $set: value
          };
          return _this4.updateState({
            data: data
          });
        };
      }
    }, {
      key: "toggleEditing",
      value: function toggleEditing() {
        boundMethodCheck(this, ModelEditor);
        return this.updateState({
          $toggle: ['isEditing']
        });
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps) {
        if (this.props.data !== prevProps.data) {
          return this.updateState({
            initialData: {
              $set: this.props.data
            }
          });
        }
      }
    }]);

    return ModelEditor;
  }(StatefulComponent);
  ModelEditor.EditButton = ModelEditButton;
  return ModelEditor;
}.call(undefined);

EditableField = function () {
  var EditableField =
  /*#__PURE__*/
  function (_Component2) {
    _inherits(EditableField, _Component2);

    function EditableField() {
      _classCallCheck(this, EditableField);

      return _possibleConstructorReturn(this, _getPrototypeOf(EditableField).apply(this, arguments));
    }

    _createClass(EditableField, [{
      key: "render",
      value: function render() {
        var actions, className, data, field, isEditing, onChange, value;
        var _this$props = this.props;
        field = _this$props.field;
        className = _this$props.className;
        var _this$context2 = this.context;
        actions = _this$context2.actions;
        data = _this$context2.data;
        isEditing = _this$context2.isEditing;
        value = data[field];
        onChange = actions.onChange(field);
        className = classNames(className, "field-".concat(field));

        if (isEditing) {
          value = h(EditableText, {
            placeholder: "Edit ".concat(field),
            multiline: true,
            className: className,
            onChange: onChange,
            value: value
          });
        }

        return h('div.text', {
          className: className
        }, value);
      }
    }]);

    return EditableField;
  }(Component);
  EditableField.contextType = ModelEditorContext;
  return EditableField;
}.call(undefined);

EditableDateField = function () {
  var EditableDateField =
  /*#__PURE__*/
  function (_Component3) {
    _inherits(EditableDateField, _Component3);

    function EditableDateField() {
      _classCallCheck(this, EditableDateField);

      return _possibleConstructorReturn(this, _getPrototypeOf(EditableDateField).apply(this, arguments));
    }

    _createClass(EditableDateField, [{
      key: "render",
      value: function render() {
        var actions, data, field, isEditing, value;
        field = this.props.field;
        var _this$context3 = this.context;
        actions = _this$context3.actions;
        data = _this$context3.data;
        isEditing = _this$context3.isEditing;
        value = data[field];

        if (!isEditing) {
          return h('div.date-input.disabled', value);
        }

        return h(DateInput, {
          className: 'date-input',
          value: new Date(value),
          formatDate: function formatDate(date) {
            return date.toLocaleDateString();
          },
          placeholder: "MM/DD/YYYY",
          showActionsBar: true,
          onChange: actions.onChange(field),
          parseDate: function parseDate(d) {
            return new Date(d);
          }
        });
      }
    }]);

    return EditableDateField;
  }(Component);
  EditableDateField.contextType = ModelEditorContext;
  return EditableDateField;
}.call(undefined);

export { EditableDateField, EditableField, ModelEditor, ModelEditorContext };
//# sourceMappingURL=model-editor.js.map
