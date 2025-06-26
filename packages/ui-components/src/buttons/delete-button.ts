import { useState, ReactNode } from "react";
import h from "@macrostrat/hyper";
import { Intent, Button, ButtonProps, Alert } from "@blueprintjs/core";

interface P extends ButtonProps {
  handleDelete(): void;
  alertContent?: ReactNode;
  itemDescription?: ReactNode;
}

function DeleteButton(props: P) {
  let {
    handleDelete = () => {},
    alertContent,
    itemDescription = "this item",
    ...rest
  } = props;
  const [alertIsShown, setIsShown] = useState(false);

  alertContent =
    alertContent ??
    h(["Are you sure you want to delete ", itemDescription, "?"]);

  const onCancel = (e) => {
    setIsShown(false);
    e.stopPropagation();
  };

  const onClick = (e) => {
    setIsShown(true);
    e.stopPropagation();
  };

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
        onConfirm: (e) => {
          handleDelete();
          onCancel(e);
        },
      },
      alertContent,
    ),
  ]);
}

export { DeleteButton };
