import h from "react-hyperscript";
import { Button, Intent, Spinner } from "@blueprintjs/core";
import classNames from "classnames";

const SaveButton = function(props) {
  let { className, inProgress, disabled, ...rest } = props;
  className = classNames(className, "save-button");
  let icon: React.ReactNode | string = "floppy-disk";
  if (inProgress) {
    icon = h(Spinner, { size: 20 });
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

const CancelButton = function(props) {
  let { className, ...rest } = props;
  className = classNames(className, "cancel-button");

  return h(Button, {
    intent: Intent.WARNING,
    className,
    ...rest
  });
};

const EditButton = function(props) {
  let { isEditing, intent, icon, className, ...rest } = props;
  if (isEditing) {
    if (intent == null) {
      intent = null;
    }
    if (icon == null) {
      icon = "tick";
    }
  } else {
    if (intent == null) {
      intent = Intent.PRIMARY;
    }
    if (icon == null) {
      icon = "edit";
    }
  }

  className = classNames(className, "edit-button");

  return h(Button, {
    icon,
    intent,
    className,
    ...rest
  });
};

export { SaveButton, EditButton, CancelButton };
export * from "./delete-button";
export * from "./link-button";
