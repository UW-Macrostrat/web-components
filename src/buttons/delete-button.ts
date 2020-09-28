import { useState, ReactNode } from "react";
import h from "@macrostrat/hyper";
import { Intent, Button, Alert } from "@blueprintjs/core";

interface P {
  handleDelete(): void;
  alertContent: ReactNode;
  itemDescription: ReactNode;
}

function DeleteButton(props: P) {
  let { handleDelete, alertContent, itemDescription, ...rest } = props;
  const [alertIsShown, setIsShown] = useState(false);

  alertContent = ["Are you sure you want to delete ", itemDescription, "?"];

  const onCancel = () => setIsShown(false);

  const onClick = () => setIsShown(true);

  const intent = Intent.DANGER;
  const icon = "trash";

  return h([
    h(Button, { onClick, icon, intent, ...rest }),
    h(
      Alert,
      {
        isOpen: alertIsShown,
        cancelButtonText: "Cancel",
        confirmButtonText: "Delete",
        icon,
        intent,
        onCancel,
        onConfirm: () => {
          handleDelete();
          onCancel();
        }
      },
      alertContent
    )
  ]);
}

DeleteButton.defaultProps = {
  handleDelete() {},
  alertContent: null,
  itemDescription: "this item"
};

export { DeleteButton };
