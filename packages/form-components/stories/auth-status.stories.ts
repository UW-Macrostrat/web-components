import h from "@macrostrat/hyper";
import { AuthStatus, BaseAuthProvider } from "../src";
import { Meta } from "@storybook/react-vite";

/* The `AuthStatus` button shows the signed-in user's name, falling back to the
  email, then "Logged in", and "Not logged in" when there is no user.
 */

const noopTransformer = async () => null;

function AuthStatusFor({ user }: { user: unknown }) {
  // BaseAuthProvider only reads `user` as its initial reducer state, so keying
  // by the user forces a remount when the controls change.
  return h(
    BaseAuthProvider,
    { key: JSON.stringify(user) ?? "null", user, transformer: noopTransformer },
    h(AuthStatus),
  );
}

function Case({ label, user }: { label: string; user: unknown }) {
  return h("div.auth-status-case", { style: { marginBottom: "1.5rem" } }, [
    h("div", { style: { fontSize: "0.8rem", opacity: 0.6 } }, label),
    h(AuthStatusFor, { user }),
  ]);
}

export default {
  title: "Form components/Auth status",
  component: AuthStatus,
  args: { name: "Jane Doe", email: "jane@example.com" },
  argTypes: {
    name: { control: "text" },
    email: { control: "text" },
  },
} as Meta<typeof AuthStatus>;

/* Each display case, driven by the shared `name` `email` controls. */
export function Test({ name, email }: { name: string; email: string }) {
  const withName = { name: name || undefined, email: email || undefined, sub: "auth0|example" };
  const emailOnly = { email: email || undefined, sub: "auth0|example" };
  return h("div", [
    h(Case, { label: "Name present → shows the name", user: withName }),
    h(Case, { label: "Name blank, email present → falls back to the email", user: emailOnly }),
    h(Case, { label: "Neither → falls back to \"Logged in\"", user: { sub: "auth0|example" } }),
    h(Case, { label: "No user → \"Not logged in\"", user: null }),
  ]);
}
