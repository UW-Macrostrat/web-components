import h from 'react-hyperscript';
import { Spinner, Button, Intent } from '@blueprintjs/core';
import classNames from 'classnames';
export { DeleteButton } from './delete-button.coffee';
export { LinkButton, NavLinkButton } from './link-button.coffee';

var CancelButton, EditButton, SaveButton;

SaveButton = function(props) {
  var className, disabled, icon, inProgress, rest;
  ({className, inProgress, disabled, ...rest} = props);
  className = classNames(className, 'save-button');
  icon = 'floppy-disk';
  if (inProgress) {
    icon = h(Spinner, {
      size: 20
    });
    disabled = true;
  }
  return h(Button, {
    icon,
    intent: Intent.SUCCESS,
    className,
    disabled,
    ...rest
  });
};

CancelButton = function(props) {
  var className, rest;
  ({className, ...rest} = props);
  className = classNames(className, 'cancel-button');
  return h(Button, {
    intent: Intent.WARNING,
    className,
    ...rest
  });
};

EditButton = function(props) {
  var className, icon, intent, isEditing, rest;
  ({isEditing, intent, icon, className, ...rest} = props);
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
  return h(Button, {icon, intent, className, ...rest});
};

export { CancelButton, EditButton, SaveButton };
