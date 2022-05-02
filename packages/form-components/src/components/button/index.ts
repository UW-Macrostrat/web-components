import { Button as B } from "@blueprintjs/core";
import { hyperStyled } from "@macrostrat/hyper";
import styles from "./btn.module.scss";

const h = hyperStyled(styles);

interface Btn {
  label: string;
}

function Button(props: Btn) {
  return h(B, [props.label]);
}

interface SubmitButtonI {
  disabled?: boolean;
  onClick: (e: any) => void;
}

function SubmitButton(props: SubmitButtonI) {
  const { disabled = false, ...rest } = props;
  return h(B, {
    onClick: rest.onClick,
    intent: "success",
    minimal: true,
    disabled,
    icon: "plus",
  });
}

export { Button, SubmitButton };
