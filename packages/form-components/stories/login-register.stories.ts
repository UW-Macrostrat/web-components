import { useState } from "react";
import { Modal, Anchor } from "@mantine/core";
import { LoginForm, Register } from "../src";
import { Meta } from "@storybook/react";
import { hyperStyled } from "@macrostrat/hyper";
import styles from "../src/components/login-register/forms.module.scss";
import { Button } from "@blueprintjs/core";

const h = hyperStyled(styles);

export default {
  title: "Form components/Login and registration forms",
  component: LoginForm,
  subcomponents: { Register },
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
} as Meta<typeof LoginForm>;

export function LoginRegisterForm({ onSubmit, error }) {
  return h("div.form-story-container", [
    h("div", [h("h3", ["Login"]), h(LoginForm, { onSubmit, error })]),
    h("div", [h("h3", ["Register"]), h(Register, { onSubmit, error })]),
  ]);
}

export function LoginRegisterModal() {
  const [open, setOpen] = useState(false);
  const [loggingOn, setLogin] = useState(false);

  const title = loggingOn ? "Login" : "Register";

  const anchorText = !loggingOn
    ? "Have an account? Login"
    : "Don't have an account? Register";

  const onSubmit = (e: any) => {
    console.log(e);
  };

  return h("div", [
    h(Button, { intent: "primary", onClick: () => setOpen(true) }, ["Login"]),
    h(Modal, { opened: open, onClose: () => setOpen(false), title }, [
      h.if(loggingOn)(LoginForm, { onSubmit, error: null }),
      h.if(!loggingOn)(Register, { onSubmit, error: null }),
      h(
        Anchor,
        {
          onClick: () => setLogin(!loggingOn),
          component: "button",
          type: "button",
          color: "gray",
          size: "sm",
        },
        [anchorText]
      ),
    ]),
  ]);
}

LoginRegisterForm.args = {
  onSubmit: (e) => console.log(e),
  error: null,
};
