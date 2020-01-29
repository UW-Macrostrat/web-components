'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var classNames = _interopDefault(require('classnames'));
var __chunk_7 = require('./buttons/index.js');
var datetime = require('@blueprintjs/datetime');
var __chunk_14 = require('./stateful.js');

var ModelEditButton,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
exports.ModelEditorContext = react.createContext({});

ModelEditButton = function () {
  var ModelEditButton =
  /*#__PURE__*/
  function (_Component) {
    __chunk_1.inherits(ModelEditButton, _Component);

    function ModelEditButton() {
      __chunk_1.classCallCheck(this, ModelEditButton);

      return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(ModelEditButton).apply(this, arguments));
    }

    __chunk_1.createClass(ModelEditButton, [{
      key: "render",
      value: function render() {
        var actions, isEditing;
        var _this$context = this.context;
        isEditing = _this$context.isEditing;
        actions = _this$context.actions;
        return h(__chunk_7.EditButton, __chunk_1.objectSpread2({
          isEditing: isEditing,
          onClick: actions.toggleEditing
        }, this.props));
      }
    }]);

    return ModelEditButton;
  }(react.Component);
  ModelEditButton.contextType = exports.ModelEditorContext;
  return ModelEditButton;
}.call(undefined);

exports.ModelEditor = function () {
  var ModelEditor =
  /*#__PURE__*/
  function (_StatefulComponent) {
    __chunk_1.inherits(ModelEditor, _StatefulComponent);

    function ModelEditor(props) {
      var _this;

      __chunk_1.classCallCheck(this, ModelEditor);

      _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(ModelEditor).call(this, props));
      _this.getValue = _this.getValue.bind(__chunk_1.assertThisInitialized(_this));
      _this.hasChanges = _this.hasChanges.bind(__chunk_1.assertThisInitialized(_this));
      _this.onChange = _this.onChange.bind(__chunk_1.assertThisInitialized(_this));
      _this.toggleEditing = _this.toggleEditing.bind(__chunk_1.assertThisInitialized(_this));
      _this.state = {
        isEditing: false,
        error: null,
        data: props.data,
        initialData: props.data
      };
      return _this;
    }

    __chunk_1.createClass(ModelEditor, [{
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
        return h(exports.ModelEditorContext.Provider, {
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
  }(__chunk_14.StatefulComponent);
  ModelEditor.EditButton = ModelEditButton;
  return ModelEditor;
}.call(undefined);

exports.EditableField = function () {
  var EditableField =
  /*#__PURE__*/
  function (_Component2) {
    __chunk_1.inherits(EditableField, _Component2);

    function EditableField() {
      __chunk_1.classCallCheck(this, EditableField);

      return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(EditableField).apply(this, arguments));
    }

    __chunk_1.createClass(EditableField, [{
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
          value = h(core.EditableText, {
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
  }(react.Component);
  EditableField.contextType = exports.ModelEditorContext;
  return EditableField;
}.call(undefined);

exports.EditableDateField = function () {
  var EditableDateField =
  /*#__PURE__*/
  function (_Component3) {
    __chunk_1.inherits(EditableDateField, _Component3);

    function EditableDateField() {
      __chunk_1.classCallCheck(this, EditableDateField);

      return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(EditableDateField).apply(this, arguments));
    }

    __chunk_1.createClass(EditableDateField, [{
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

        return h(datetime.DateInput, {
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
  }(react.Component);
  EditableDateField.contextType = exports.ModelEditorContext;
  return EditableDateField;
}.call(undefined);
//# sourceMappingURL=model-editor.js.map
