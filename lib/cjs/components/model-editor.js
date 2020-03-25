'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var update = _interopDefault(require('immutability-helper'));
var __chunk_5 = require('./util/stateful.js');
require('./util/hooks.js');
var classNames = _interopDefault(require('classnames'));
var __chunk_11 = require('./buttons/index.js');
var datetime = require('@blueprintjs/datetime');
var T = _interopDefault(require('prop-types'));

var boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
exports.ModelEditorContext = react.createContext({});

exports.ModelEditButton = function () {
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
        return h(__chunk_11.EditButton, __chunk_1.objectSpread2({
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
      _this.onPersistChanges = _this.onPersistChanges.bind(__chunk_1.assertThisInitialized(_this));
      _this.persistChanges = _this.persistChanges.bind(__chunk_1.assertThisInitialized(_this));
      _this.state = {
        isEditing: props.isEditing || false,
        isPersisting: null,
        error: null,
        model: props.model,
        initialModel: props.model
      };
      return _this;
    }

    __chunk_1.createClass(ModelEditor, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var actions, canEdit, isEditing, model, value;
        model = this.state.model;
        canEdit = this.props.canEdit;
        isEditing = this.state.isEditing && canEdit;

        actions = function () {
          var _this3;

          var onChange, persistChanges, toggleEditing, updateState;
          return _this3 = _this2, onChange = _this3.onChange, toggleEditing = _this3.toggleEditing, updateState = _this3.updateState, persistChanges = _this3.persistChanges, _this3;
        }();

        value = {
          actions: actions,
          model: model,
          isEditing: isEditing,
          canEdit: canEdit,
          hasChanges: this.hasChanges
        };
        return h(exports.ModelEditorContext.Provider, {
          value: value
        }, this.props.children);
      }
    }, {
      key: "getValue",
      value: function getValue(field) {
        boundMethodCheck(this, ModelEditor);
        return this.state.model[field];
      }
    }, {
      key: "hasChanges",
      value: function hasChanges(field) {
        boundMethodCheck(this, ModelEditor);

        if (field == null) {
          return this.state.initialModel !== this.state.model;
        }

        return this.state.initialModel[field] !== this.state.model[field];
      }
    }, {
      key: "onChange",
      value: function onChange(field) {
        var _this4 = this;

        boundMethodCheck(this, ModelEditor);
        return function (value) {
          return _this4.updateState({
            model: __chunk_1.defineProperty({}, field, {
              $set: value
            })
          });
        };
      }
    }, {
      key: "toggleEditing",
      value: function toggleEditing() {
        var spec;
        boundMethodCheck(this, ModelEditor);
        spec = {
          $toggle: ['isEditing']
        };

        if (this.state.isEditing) {
          spec.model = {
            $set: this.state.initialModel
          };
        }

        return this.updateState(spec);
      }
    }, {
      key: "onPersistChanges",
      value: function onPersistChanges() {
        boundMethodCheck(this, ModelEditor);
        return this.persistChanges();
      }
    }, {
      key: "persistChanges",
      value: function () {
        var _persistChanges = __chunk_1.asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee(spec) {
          var changeset, err, k, newModel, persistChanges, ret, updatedModel, v;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  boundMethodCheck(this, ModelEditor);
                  persistChanges = this.props.persistChanges;
                  // Persist changes expects a promise
                  updatedModel = this.state.model;

                  if (spec != null) {
                    // If changeset is provided, we need to integrate
                    // it before proceeding
                    console.log(spec);
                    updatedModel = update(this.state.model, spec);
                  }

                  console.log(updatedModel);
                  ret = null;

                  if (!(persistChanges == null)) {
                    _context.next = 8;
                    break;
                  }

                  return _context.abrupt("return", null);

                case 8:
                  _context.prev = 8;
                  this.updateState({
                    isPersisting: {
                      $set: true
                    }
                  }); // Compute a shallow changeset of the model fields

                  changeset = {};
                  _context.t0 = regeneratorRuntime.keys(updatedModel);

                case 12:
                  if ((_context.t1 = _context.t0()).done) {
                    _context.next = 20;
                    break;
                  }

                  k = _context.t1.value;
                  v = updatedModel[k];

                  if (!(v === this.state.initialModel[k])) {
                    _context.next = 17;
                    break;
                  }

                  return _context.abrupt("continue", 12);

                case 17:
                  changeset[k] = v;
                  _context.next = 12;
                  break;

                case 20:
                  _context.next = 22;
                  return persistChanges(updatedModel, changeset);

                case 22:
                  return _context.abrupt("return", ret = _context.sent);

                case 25:
                  _context.prev = 25;
                  _context.t2 = _context["catch"](8);
                  err = _context.t2;
                  return _context.abrupt("return", console.error(err));

                case 29:
                  _context.prev = 29;
                  spec = {
                    isPersisting: {
                      $set: false
                    }
                  };

                  if (ret != null) {
                    newModel = update(this.state.initialModel, {
                      $merge: ret
                    });
                    console.log(newModel);
                    spec.model = {
                      $set: newModel
                    };
                    spec.initialModel = {
                      $set: newModel
                    };
                  }

                  this.updateState(spec);
                  return _context.finish(29);

                case 34:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[8, 25, 29, 34]]);
        }));

        function persistChanges(_x) {
          return _persistChanges.apply(this, arguments);
        }

        return persistChanges;
      }()
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps) {
        var spec;

        if (prevProps == null) {
          return;
        }

        if (prevProps === this.props) {
          return;
        }

        spec = {};

        if (this.props.isEditing !== prevProps.isEditing && this.props.isEditing !== this.state.isEditing) {
          spec.isEditing = {
            $set: this.props.isEditing
          };
        }

        if (this.props.model !== prevProps.model) {
          spec.initialModel = {
            $set: this.props.model
          };
        }

        return this.updateState(spec);
      }
    }]);

    return ModelEditor;
  }(__chunk_5.StatefulComponent);
  ModelEditor.defaultProps = {
    canEdit: true
  };
  ModelEditor.propTypes = {
    model: T.object.isRequired,
    persistChanges: T.func
  };
  return ModelEditor;
}.call(undefined);

exports.EditableMultilineText = function () {
  var EditableMultilineText =
  /*#__PURE__*/
  function (_Component2) {
    __chunk_1.inherits(EditableMultilineText, _Component2);

    function EditableMultilineText() {
      __chunk_1.classCallCheck(this, EditableMultilineText);

      return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(EditableMultilineText).apply(this, arguments));
    }

    __chunk_1.createClass(EditableMultilineText, [{
      key: "render",
      value: function render() {
        var actions, className, field, isEditing, model, onChange, value;
        var _this$props = this.props;
        field = _this$props.field;
        className = _this$props.className;
        var _this$context2 = this.context;
        actions = _this$context2.actions;
        model = _this$context2.model;
        isEditing = _this$context2.isEditing;
        value = model[field];
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

    return EditableMultilineText;
  }(react.Component);
  EditableMultilineText.contextType = exports.ModelEditorContext;
  return EditableMultilineText;
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
        var actions, field, isEditing, model, value;
        field = this.props.field;
        var _this$context3 = this.context;
        actions = _this$context3.actions;
        model = _this$context3.model;
        isEditing = _this$context3.isEditing;
        value = model[field];

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

exports.useModelEditor = function useModelEditor() {
  return react.useContext(exports.ModelEditorContext);
};
//# sourceMappingURL=model-editor.js.map
