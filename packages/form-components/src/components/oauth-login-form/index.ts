import { Button, Callout } from "@blueprintjs/core";
import classNames from "classnames";
import { FormEvent, ReactNode, useState } from "react";
import { providerMarks } from "./provider-marks";
import h from "./oauth-login-form.module.sass";

export interface LoginCredentials {
  email: string;
  password: string;
}

/** A third-party sign-in option, drawn as a "Continue with …" link. */
export interface OAuthProvider {
  /** `google`, `facebook` and `apple` get their brand's mark and colors. */
  id: string;
  label: string;
  /** Where the provider's sign-in flow starts. */
  href: string;
  /** Overrides the built-in mark for `id`. */
  mark?: ReactNode;
}

export interface OAuthLoginFormProps {
  /** Called with the email and password when the form is submitted. */
  onSubmit: (credentials: LoginCredentials) => void;
  /** Sign-in options under the "or" divider; none hides the divider. */
  providers?: OAuthProvider[];
  /** Shown in a "Login failed" callout under the form. */
  error?: ReactNode;
  className?: string;
}

/**
 * An email-and-password login form with third-party sign-in options below it,
 * as on Rockd's `/login` page. The form holds its own field state and hands the
 * credentials to `onSubmit`; making the request, and reporting a failure back
 * through `error`, is the caller's.
 */
export function OAuthLoginForm({
  onSubmit,
  providers = [],
  error,
  className,
}: OAuthLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ email, password });
  }

  return h("form.oauth-login-form", { className, onSubmit: handleSubmit }, [
    h("input.login-field", {
      type: "email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      placeholder: "Email",
    }),
    h("input.login-field", {
      type: "password",
      value: password,
      onChange: (e) => setPassword(e.target.value),
      placeholder: "Password",
    }),
    h(
      Button,
      {
        type: "submit",
        className: "login-button",
        icon: "log-in",
        large: true,
        minimal: true,
      },
      "Login",
    ),
    h.if(providers.length > 0)(OAuthProviderList, { providers }),
    h.if(error != null)(
      Callout,
      { intent: "danger", title: "Login failed" },
      error,
    ),
  ]);
}

/** The Google, Facebook and Apple options for a server that starts each
 * provider's flow at `<authBaseURL>/<id>`. */
export function oauthProviders(
  authBaseURL: string,
  ids: string[] = ["google", "facebook", "apple"],
): OAuthProvider[] {
  const base = authBaseURL.replace(/\/$/, "");
  return ids.map((id) => ({
    id,
    label: "Continue with " + providerName(id),
    href: base + "/" + id,
  }));
}

function OAuthProviderList({ providers }: { providers: OAuthProvider[] }) {
  return h([
    h("div.divider", [h("hr"), h("span", "or"), h("hr")]),
    h(
      "div.oauth-buttons",
      providers.map((provider) =>
        h(OAuthProviderButton, { key: provider.id, provider }),
      ),
    ),
  ]);
}

function OAuthProviderButton({ provider }: { provider: OAuthProvider }) {
  const { id, label, href } = provider;
  const mark = provider.mark ?? providerMarks[id];
  return h("a.oauth-button", { className: classNames(id), href }, [
    mark,
    h("span", label),
  ]);
}

function providerName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
