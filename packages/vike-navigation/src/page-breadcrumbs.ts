import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { ReactNode } from "react";
import { SitePageHeader, SitePageHeaderProps } from "./site-page-header";
import { useSiteNavigation } from "./context";

const h = hyper;

export interface PageBreadcrumbsProps extends Pick<
  SitePageHeaderProps,
  "items" | "actions" | "className" | "titleAdornment"
> {
  /** Show the site's logo beside the trail. */
  showLogo?: boolean;
  /** Give the title a line of its own beneath the trail, rather than ending
   * the trail with it. */
  separateTitle?: boolean;
  /** `small` for tight spaces, such as a map's context panel. */
  size?: "default" | "small";
}

/**
 * The route's trail on its own, for a navbar, drawer or map panel rather
 * than the top of a page: a full-width, non-sticky `SitePageHeader`. The
 * title ends the trail unless `separateTitle` gives it its own line.
 */
export function PageBreadcrumbs({
  showLogo = true,
  separateTitle = false,
  size = "default",
  className,
  ...rest
}: PageBreadcrumbsProps) {
  let variant: SitePageHeaderProps["variant"] = "compact";
  if (separateTitle) {
    variant = "expanded";
  }
  let logo: ReactNode = undefined;
  if (!showLogo) {
    logo = null;
  }
  return h(SitePageHeader, {
    variant,
    size,
    logo,
    width: "full",
    className: classNames("page-breadcrumbs", className),
    ...rest,
  });
}

/** The site's mark as a link home, sized by the header it sits in. */
export function SiteLogoLink({
  src,
  href = "/",
  label,
  children,
}: {
  src?: string;
  href?: string;
  label?: string;
  children?: ReactNode;
}) {
  const { siteName } = useSiteNavigation();
  let content = children;
  if (content == null && src != null) {
    content = h("img", { src, alt: "" });
  }
  return h(
    "a.page-header-logo-link",
    { href, "aria-label": label ?? `${siteName ?? "Site"} home` },
    content,
  );
}
