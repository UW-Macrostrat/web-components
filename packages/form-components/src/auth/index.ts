import { hyperStyled } from "@macrostrat/hyper";
import { Button, IconName } from "@blueprintjs/core";
import { LogoutForm } from "./login-form";
import { useAuth } from "./context";
import styles from "./main.module.sass";
const h = hyperStyled(styles);

/* Display user's name in the login button field.
  It'll render the user from `/security/me` and fall back to 'Logged in' when no
  name is available. */
function userDisplayName(user: unknown): string {
  if (typeof user === "string") return user;
  if (user != null && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const label = u.name ?? u.username ?? u.email;
    if (typeof label === "string" && label.length > 0) return label;
  }
  return "Logged in";
}

function AuthStatus(props) {
  const { runAction, user } = useAuth();
  let { className, large = true, showText = true } = props;

  let text = "Not logged in";
  let icon: IconName = "blocked-person";
  let action: () => void = () => runAction({ type: "login" });
  if (user != null) {
    text = userDisplayName(user);
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
