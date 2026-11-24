import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { AnchorHTMLAttributes } from "react";
import { usePageContext } from "vike-react/usePageContext";

const h = hyper;

/** Whether `href` is the current page. */
export function useLinkIsActive(href: string | undefined): boolean {
  const ctx = usePageContext();
  // No page context outside Vike (e.g. in a story).
  if (ctx == null || href == null) return false;
  return ctx.urlPathname === href;
}

/** A link that marks itself `is-active` when it points at the current page. */
export function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isActive = useLinkIsActive(props.href);
  const className = classNames(props.className, { "is-active": isActive });
  let ariaCurrent: "page" | undefined = undefined;
  if (isActive) {
    ariaCurrent = "page";
  }
  return h("a", { ...props, className, "aria-current": ariaCurrent });
}
