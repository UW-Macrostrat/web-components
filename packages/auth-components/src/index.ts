import { hyperStyled } from "@macrostrat/hyper";
import { Button, IconName } from "@blueprintjs/core";
import { LoginForm } from "./login-form";
import { AuthProvider, useAuth } from "./context";
import styles from "./main.module.styl";
const h = hyperStyled(styles);

function AuthStatus(props) {
  const { runAction, user } = useAuth();
  let { className, large = true, showText = true } = props;

  let text = "Not logged in";
  let icon: IconName = "blocked-person";
  if (user != null) {
    text = "Logged in";
    icon = "person";
  }
  return h("div.auth-status", { className }, [
    h(LoginForm),
    h(
      Button,
      {
        minimal: true,
        large,
        icon,
        onClick: () => runAction({ type: "request-form" }),
      },
      showText ? text : null
    ),
  ]);
}

export * from "./login-form";
export * from "./util";
export { AuthProvider, AuthStatus, useAuth };
