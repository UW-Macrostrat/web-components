import h from "@macrostrat/hyper";
import { useState } from "react";
import { Dialog, Classes, Button, ButtonGroup } from "@blueprintjs/core";
import { SaveButton, CancelButton } from "@macrostrat/ui-components";

function SubmitDialog({
  onClick,
  content,
  className = null,
  disabled,
  ...rest
}) {
  const [open, setOpen] = useState(false);
  return h("div", null, [
    h(
      SaveButton,
      {
        disabled: disabled,
        ...rest,
        onClick: () => setOpen(true),
      },
      "Save Changes",
    ),
    h(Dialog, { isOpen: open }, [
      h("div", { className: Classes.DIALOG_HEADER }, h("h3", null, "WARNING")),
      h("div", { className: Classes.DIALOG_BODY }, h("p", null, content)),
      h("div", { className: Classes.DIALOG_FOOTER }, [
        h(
          SaveButton,
          {
            className: "save-btn",
            small: true,
            onClick: () => {
              onClick();
              setOpen(false);
            },
          },
          "Save changes",
        ),
        h(
          CancelButton,
          {
            small: true,
            onClick: () => setOpen(false),
          },
          "Cancel",
        ),
      ]),
    ]),
  ]);
}

export function SheetToolbar(props) {
  const { onSubmit, onUndo, hasChanges, children } = props;
  const buttonProps = { disabled: !hasChanges, small: true };
  var constant =
    "Are you sure you want to save your edits? All changes will be final. If you do not want to submit, click Cancel.";
  return h("div.sheet-header", [
    h("h3.sheet-title", "Sample metadata"),
    h(ButtonGroup, { className: "sheet-actions" }, [
      h(SubmitDialog, {
        className: "save-btn",
        onClick: onSubmit,
        content: constant,
        ...buttonProps,
      }),
      h(
        Button,
        {
          onClick: onUndo,
          ...buttonProps,
        },
        "Reset changes",
      ),
    ]),
    h("div.spacer"),
    children,
  ]);
}
