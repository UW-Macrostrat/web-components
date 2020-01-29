import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../../_virtual/_rollupPluginBabelHelpers.js';
import h from 'react-hyperscript';
import { Spinner, Button, Intent } from '@blueprintjs/core';
import classNames from 'classnames';
export { DeleteButton } from './delete-button.js';
export { LinkButton, NavLinkButton } from './link-button.js';

var CancelButton, EditButton, SaveButton;

SaveButton = function SaveButton(props) {
  var className, disabled, icon, inProgress, rest;
  className = props.className;
  inProgress = props.inProgress;
  disabled = props.disabled;
  rest = _objectWithoutProperties(props, ["className", "inProgress", "disabled"]);
  className = classNames(className, 'save-button');
  icon = 'floppy-disk';

  if (inProgress) {
    icon = h(Spinner, {
      size: 20
    });
    disabled = true;
  }

  return h(Button, _objectSpread2({
    icon: icon,
    intent: Intent.SUCCESS,
    className: className,
    disabled: disabled
  }, rest));
};

CancelButton = function CancelButton(props) {
  var className, rest;
  className = props.className;
  rest = _objectWithoutProperties(props, ["className"]);
  className = classNames(className, 'cancel-button');
  return h(Button, _objectSpread2({
    intent: Intent.WARNING,
    className: className
  }, rest));
};

EditButton = function EditButton(props) {
  var className, icon, intent, isEditing, rest;
  isEditing = props.isEditing;
  intent = props.intent;
  icon = props.icon;
  className = props.className;
  rest = _objectWithoutProperties(props, ["isEditing", "intent", "icon", "className"]);

  if (isEditing) {
    if (intent == null) {
      intent = null;
    }

    if (icon == null) {
      icon = 'tick';
    }
  } else {
    if (intent == null) {
      intent = Intent.PRIMARY;
    }

    if (icon == null) {
      icon = 'edit';
    }
  }

  className = classNames(className, 'edit-button');
  return h(Button, _objectSpread2({
    icon: icon,
    intent: intent,
    className: className
  }, rest));
};

export { CancelButton, EditButton, SaveButton };
//# sourceMappingURL=index.js.map
