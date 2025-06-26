import { hyperStyled } from "@macrostrat/hyper";
import { Button, IconName } from "@blueprintjs/core";
import { LogoutForm } from "./login-form";
import { useAuth } from "./context";
import styles from "./main.module.sass";
const h = hyperStyled(styles);

function AuthStatus(props) {
  const { runAction, user } = useAuth();
  let { className, large = true, showText = true } = props;

  let text = "Not logged in";
  let icon: IconName = "blocked-person";
  let action: () => void = () => runAction({ type: "login" });
  if (user != null) {
    text = "Logged in";
    icon = "person";
    action = () => runAction({ type: "request-form" });
  }
  return h("div.auth-status", { className }, [
    h(LogoutForm),
    h(
      Button,
      {
        minimal: true,
        large,
        icon,
        onClick: action,
      },
      showText ? text : null,
    ),
  ]);
}

export { AuthStatus };
export * from "./login-form";
export * from "./util";
export * from "./context";
