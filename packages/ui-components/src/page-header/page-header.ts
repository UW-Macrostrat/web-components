import { Button, ButtonProps } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import styles from "./page-header.module.sass";
import { BreadcrumbTrail, Crumb } from "./trail";

const h = hyper.styled(styles);

/**
 * - `expanded`: breadcrumbs on one row, with a large title snugged beneath them.
 * - `compact`: a single fixed-height row; the title is the trail's last crumb.
 * - `hybrid`: expanded at rest; once the large title scrolls under the
 *   (sticky) breadcrumb row, the title moves inline into the trail.
 */
export type PageHeaderVariant = "expanded" | "compact" | "hybrid";

/** `full` spans its container; `constrained` centres on the content column. */
export type PageHeaderWidth = "full" | "constrained";

export interface PageHeaderProps {
  /** Brand mark, usually a link home. Sized by `--page-header-logo-size`. */
  logo?: ReactNode;
  /** Ancestor pages, root first. The current page is `title`, not a crumb. */
  breadcrumbs?: Crumb[];
  /** The current page's title. */
  title?: ReactNode;
  /** A short identifier for the current item, e.g. `#3712`. */
  identifier?: ReactNode;
  /** Right-aligned toolbar content: buttons, view switchers, login. */
  actions?: ReactNode;
  variant?: PageHeaderVariant;
  /** Keep the breadcrumb row in view while scrolling. Always on for `hybrid`.
   * The header's parent is the sticky boundary, so render it as a direct child
   * of the page (or scroll container). */
  sticky?: boolean;
  width?: PageHeaderWidth;
  className?: string;
  /** Supporting content under the large title (description, tabs…). */
  children?: ReactNode;
}

export function PageHeader(props: PageHeaderProps) {
  const {
    logo,
    breadcrumbs = [],
    title,
    identifier,
    actions,
    variant = "expanded",
    sticky = false,
    width = "full",
    className,
    children,
  } = props;

  const isSticky = sticky || variant == "hybrid";
  const hasTitleBlock =
    variant != "compact" && (title != null || children != null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { isStuck, isTitleTucked } = useHeaderScrollState(
    { sentinel: sentinelRef, bar: barRef, title: titleRef },
    isSticky,
  );

  const isCollapsed = variant == "hybrid" && isTitleTucked;
  let current: ReactNode = null;
  if (title != null && (variant == "compact" || isCollapsed)) {
    current = h(InlineTitle, {
      title,
      identifier,
      // In hybrid mode the large title remains the page's heading.
      isHeading: variant == "compact",
    });
  }

  return h(
    "header.page-header",
    {
      className: classNames(variant, width, className, {
        sticky: isSticky,
        stuck: isStuck,
        collapsed: isCollapsed,
        "has-logo": logo != null,
      }),
    },
    [
      h("div.sentinel", { ref: sentinelRef, "aria-hidden": true }),
      h(
        "div.bar",
        { ref: barRef },
        h("div.bar-inner", [
          h.if(logo != null)("div.logo", logo),
          h("div.trail-container", [
            h(BreadcrumbTrail, {
              crumbs: breadcrumbs,
              current,
              hasLogo: logo != null,
            }),
          ]),
          h.if(actions != null)("div.actions", actions),
        ]),
      ),
      h.if(hasTitleBlock)(
        "div.title-block",
        h("div.title-block-inner", [
          h.if(title != null)("div.title-row", [
            h("h1.page-title", { ref: titleRef }, title),
            h.if(identifier != null)("span.identifier", identifier),
          ]),
          h.if(children != null)("div.supporting", children),
        ]),
      ),
    ],
  );
}

function InlineTitle({ title, identifier, isHeading }) {
  let headingProps = {};
  if (isHeading) {
    headingProps = { role: "heading", "aria-level": 1 };
  } else {
    headingProps = { "aria-hidden": true };
  }
  return h([
    h("span.inline-title", headingProps, title),
    h.if(identifier != null)("span.identifier.inline-identifier", identifier),
  ]);
}

export interface PageHeaderButtonProps extends ButtonProps {
  /** Label that is dropped (leaving the icon) when the header runs short of
   * room. Strings also become the button's accessible name. */
  text?: ReactNode;
}

/**
 * A header action whose label collapses to its icon when the header is
 * narrow, so actions give up width before the title has to.
 */
export function PageHeaderButton(props: PageHeaderButtonProps) {
  const { text, className, ...rest } = props;
  let ariaLabel: string | undefined = undefined;
  if (typeof text == "string") {
    ariaLabel = text;
  }
  return h(Button, {
    "aria-label": ariaLabel,
    ...rest,
    className: classNames("page-header-button", className),
    text: h.if(text != null)("span.action-label", text),
  });
}

interface HeaderRefs {
  sentinel: RefObject<HTMLElement | null>;
  bar: RefObject<HTMLElement | null>;
  title: RefObject<HTMLElement | null>;
}

/** Whether the sticky bar is stuck, and whether the large title has scrolled
 * (at least halfway) under it. Listens to scroll events in the capture phase,
 * so it follows nested scroll containers as well as the document. */
function useHeaderScrollState(refs: HeaderRefs, enabled: boolean) {
  const [state, setState] = useState({ isStuck: false, isTitleTucked: false });

  useEffect(() => {
    if (!enabled) {
      setState({ isStuck: false, isTitleTucked: false });
      return;
    }
    let frame: number | null = null;

    function update() {
      frame = null;
      const sentinel = refs.sentinel.current?.getBoundingClientRect();
      const bar = refs.bar.current?.getBoundingClientRect();
      if (sentinel == null || bar == null) return;
      // At rest the sentinel sits exactly at the bar's top edge; once the bar
      // is held by `position: sticky`, the sentinel scrolls on past it.
      const isStuck = sentinel.top < bar.top - 0.5;
      let isTitleTucked = false;
      const title = refs.title.current?.getBoundingClientRect();
      if (title != null) {
        isTitleTucked = (title.top + title.bottom) / 2 < bar.bottom;
      }
      setState((prev) => {
        if (prev.isStuck == isStuck && prev.isTitleTucked == isTitleTucked) {
          return prev;
        }
        return { isStuck, isTitleTucked };
      });
    }

    function schedule() {
      if (frame == null) {
        frame = requestAnimationFrame(update);
      }
    }

    update();
    const opts = { capture: true, passive: true };
    window.addEventListener("scroll", schedule, opts);
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule, opts);
      window.removeEventListener("resize", schedule);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return state;
}
