'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var classNames = _interopDefault(require('classnames'));
var __chunk_9 = require('./delete-button.js');
var __chunk_10 = require('./link-button.js');

exports.SaveButton = function SaveButton(props) {
  var className, disabled, icon, inProgress, rest;
  className = props.className;
  inProgress = props.inProgress;
  disabled = props.disabled;
  rest = __chunk_1.objectWithoutProperties(props, ["className", "inProgress", "disabled"]);
  className = classNames(className, 'save-button');
  icon = 'floppy-disk';

  if (inProgress) {
    icon = h(core.Spinner, {
      size: 20
    });
    disabled = true;
  }

  return h(core.Button, __chunk_1.objectSpread2({
    icon: icon,
    intent: core.Intent.SUCCESS,
    className: className,
    disabled: disabled
  }, rest));
};

exports.CancelButton = function CancelButton(props) {
  var className, rest;
  className = props.className;
  rest = __chunk_1.objectWithoutProperties(props, ["className"]);
  className = classNames(className, 'cancel-button');
  return h(core.Button, __chunk_1.objectSpread2({
    intent: core.Intent.WARNING,
    className: className
  }, rest));
};

exports.EditButton = function EditButton(props) {
  var className, icon, intent, isEditing, rest;
  isEditing = props.isEditing;
  intent = props.intent;
  icon = props.icon;
  className = props.className;
  rest = __chunk_1.objectWithoutProperties(props, ["isEditing", "intent", "icon", "className"]);

  if (isEditing) {
    if (intent == null) {
      intent = null;
    }

    if (icon == null) {
      icon = 'tick';
    }
  } else {
    if (intent == null) {
      intent = core.Intent.PRIMARY;
    }

    if (icon == null) {
      icon = 'edit';
    }
  }

  className = classNames(className, 'edit-button');
  return h(core.Button, __chunk_1.objectSpread2({
    icon: icon,
    intent: intent,
    className: className
  }, rest));
};

Object.defineProperty(exports, 'DeleteButton', {
  enumerable: true,
  get: function () {
    return __chunk_9.DeleteButton;
  }
});
Object.defineProperty(exports, 'LinkButton', {
  enumerable: true,
  get: function () {
    return __chunk_10.LinkButton;
  }
});
Object.defineProperty(exports, 'NavLinkButton', {
  enumerable: true,
  get: function () {
    return __chunk_10.NavLinkButton;
  }
});
//# sourceMappingURL=index.js.map
