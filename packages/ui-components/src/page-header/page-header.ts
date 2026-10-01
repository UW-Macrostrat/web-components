import { Button } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { ReactNode, RefObject, useMemo, useRef, useState } from "react";
import {
  fittingFormIndex,
  ShortenMode,
  ShortForms,
  shortenedForms,
} from "../util/shorten";
import { useIsomorphicLayoutEffect } from "../util/isomorphic-layout-effect";
import styles from "./page-header.module.sass";
import { BreadcrumbTrail, Crumb } from "./trail";
import {
  ToolbarButton,
  ToolbarButtonProps,
  ToolbarDropdown,
} from "../toolbar/toolbar";

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

/** Whether the actions fold into a single "more" dropdown: `never`, below
 * `collapseActionsBelow` (`narrow`), or `always`. */
export type PageHeaderActionsCollapse = "never" | "narrow" | "always";

export interface PageHeaderProps {
  /** Brand mark, usually a link home. Sized by `--page-header-logo-size`. */
  logo?: ReactNode;
  /** Ancestor pages, root first. The current page is `title`, not a crumb. */
  breadcrumbs?: Crumb[];
  /** The current page's title. */
  title?: ReactNode;
  /** Shorter forms of the title for the single-row (inline) title: a string,
   * a list (longest first), or a `Shortener` applied to a string `title`. The
   * large expanded title always shows `title` in full. */
  shortTitle?: ShortForms;
  /** When the inline title uses `shortTitle`: `narrow` (default) steps down
   * to the longest form that fits once crumbs have collapsed; `always` starts
   * from the first short form; `never` keeps the full title (truncating). */
  shortenTitle?: ShortenMode;
  /** A short identifier for the current item, e.g. `#3712`. */
  identifier?: ReactNode;
  /** Right-aligned toolbar content: buttons, view switchers, login. */
  actions?: ReactNode;
  /** Opt in to folding `actions` into a dropdown. Default `never`. */
  collapseActions?: PageHeaderActionsCollapse;
  /** Bar width (px) below which `narrow` folds the actions, when folding
   * isn't title-driven (no inline title, or `prioritizeTitle: false`).
   * Default 640. */
  collapseActionsBelow?: number;
  /** What the dropdown shows once folded, e.g. a Blueprint `Menu`. Defaults to
   * `actions` itself, stacked, with every label shown. */
  actionsMenu?: ReactNode;
  /** Let the inline title, not fixed bar widths, decide when secondary content
   * gives way. Whenever the title lacks room for its full form, the bar steps
   * down — action labels to icons, then the inline identifier, then (if
   * `collapseActions` isn't `never`) actions into the dropdown — before the
   * title shortens or truncates. `true` protects up to 20em of title; a number
   * sets that reserve in ems, so a very long title doesn't strip the bar bare.
   * On by default. `false`, or a bar with no inline title (expanded, or hybrid
   * at rest), drops labels and identifier at fixed bar widths instead. */
  prioritizeTitle?: boolean | number;
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
    shortTitle,
    shortenTitle = "narrow",
    identifier,
    actions,
    collapseActions = "never",
    collapseActionsBelow = 640,
    actionsMenu,
    prioritizeTitle = true,
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
  const barInnerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const inlineIdentifierRef = useRef<HTMLSpanElement>(null);
  // A callback ref held in state: the title crumb can mount a render after
  // the header's own (`OverflowList` keeps its visible items in state), and
  // measuring must follow it rather than the header's commit.
  const [titleMeasure, setTitleMeasure] = useState<HTMLElement | null>(null);
  const { isStuck, isTitleTucked } = useHeaderScrollState(
    { sentinel: sentinelRef, bar: barRef, title: titleRef },
    isSticky,
  );

  const isCollapsed = variant == "hybrid" && isTitleTucked;
  const isTitleInline = title != null && (variant == "compact" || isCollapsed);
  // Title-first adaptation applies while the title is in the bar; otherwise
  // (and when opted out) labels and identifier drop at fixed bar widths.
  const isTitleFirst = prioritizeTitle !== false && isTitleInline;
  const isNarrow = useIsNarrower(
    barInnerRef,
    collapseActionsBelow,
    collapseActions == "narrow" && !isTitleFirst,
  );
  const titleForms = useTitleForms(title, shortTitle);
  const titleSpace: TitleSpaceRefs = {
    measure: titleMeasure,
    container: trailContainerRef,
    identifier: inlineIdentifierRef,
    // Crumbs that can fold into the "…" menu leave that menu (and its
    // chevron) behind; a lone root beside a logo vanishes outright.
    hasCollapsedCrumbs: breadcrumbs.length > (logo != null ? 1 : 0),
  };

  let titleReserve = defaultTitleReserve;
  if (typeof prioritizeTitle == "number") {
    titleReserve = prioritizeTitle;
  }
  let maxYield = YieldLevel.HideIdentifier;
  if (collapseActions != "never" && actions != null) {
    maxYield = YieldLevel.FoldActions;
  }
  const yieldLevel = useYieldLevel(
    isTitleFirst,
    maxYield,
    titleReserve,
    titleSpace,
  );

  let foldActions =
    actions != null &&
    (collapseActions == "always" || (collapseActions == "narrow" && isNarrow));
  if (isTitleFirst && collapseActions == "narrow") {
    // Folding becomes the last rung of the ladder instead of a fixed width.
    foldActions = yieldLevel >= YieldLevel.FoldActions;
  }

  // Measured here rather than in the title: a parent's DOM refs are attached
  // only after its children's layout effects have run.
  const titleIndex = useFittingTitle(
    titleForms,
    shortenTitle,
    isTitleInline,
    titleSpace,
    // Hiding the inline identifier frees room inside the trail without
    // resizing it, so each step of the ladder needs a fresh measure.
    yieldLevel,
  );
  let current: ReactNode = null;
  if (isTitleInline) {
    current = h(InlineTitle, {
      title,
      forms: titleForms,
      index: titleIndex,
      measureRef: setTitleMeasure,
      alwaysMeasure: prioritizeTitle !== false,
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
        "adapt-width": !isTitleFirst,
        "hide-labels": isTitleFirst && yieldLevel >= YieldLevel.HideLabels,
        "hide-identifier":
          isTitleFirst && yieldLevel >= YieldLevel.HideIdentifier,
      }),
    },
    [
      h("div.sentinel", { ref: sentinelRef, "aria-hidden": true }),
      h(
        "div.bar",
        { ref: barRef },
        h("div.bar-inner", { ref: barInnerRef }, [
          h.if(logo != null)("div.logo", logo),
          h("div.trail-container", { ref: trailContainerRef }, [
            h(BreadcrumbTrail, {
              crumbs: breadcrumbs,
              current,
              hasLogo: logo != null,
            }),
            // Right-aligned, where it sits in the expanded title row.
            h.if(isTitleInline && identifier != null)(
              "span.identifier.inline-identifier",
              { "aria-hidden": variant == "hybrid", ref: inlineIdentifierRef },
              identifier,
            ),
          ]),
          h.if(actions != null && !foldActions)("div.actions", actions),
          h.if(foldActions)(
            "div.actions",
            h(ActionsDropdown, { content: actionsMenu ?? actions }),
          ),
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

interface InlineTitleProps {
  title: ReactNode;
  /** `title` and its strictly shorter forms. */
  forms: ReactNode[];
  index: number;
  measureRef: (el: HTMLElement | null) => void;
  /** Lay out the measurer even for a single form (title-first adaptation
   * needs the full title's width). */
  alwaysMeasure: boolean;
  isHeading: boolean;
}

/** The title as the trail's current crumb, showing the form the header has
 * measured to fit (truncating if even the shortest doesn't). */
function InlineTitle(props: InlineTitleProps) {
  const { title, forms, index, measureRef, alwaysMeasure, isHeading } = props;

  let fullText: string | undefined = undefined;
  if (typeof title == "string") {
    fullText = title;
  }
  let headingProps: object = { "aria-hidden": true };
  if (isHeading) {
    // A shortened heading still announces the full title.
    headingProps = { role: "heading", "aria-level": 1, "aria-label": fullText };
  }
  let tooltip: string | undefined = undefined;
  if (index > 0) {
    tooltip = fullText;
  }

  return h([
    h("span.inline-title", { ...headingProps, title: tooltip }, forms[index]),
    // Every form, laid out unseen, so each can be measured at the crumb's own
    // type size without ever rendering it in place.
    h.if(forms.length > 1 || alwaysMeasure)(
      "span.title-measure",
      { ref: measureRef, "aria-hidden": true },
      forms.map((form, i) => h("span", { key: i }, form)),
    ),
  ]);
}

/** `title` followed by its strictly shorter forms. */
function useTitleForms(title: ReactNode, shortTitle?: ShortForms) {
  return useMemo(() => {
    if (typeof title == "string") {
      return shortenedForms(title, shortTitle);
    }
    return [title, ...shortenedForms(null, shortTitle)];
  }, [title, shortTitle]);
}

interface TitleSpaceRefs {
  /** The unseen layout of every title form. */
  measure: HTMLElement | null;
  container: RefObject<HTMLElement | null>;
  identifier: RefObject<HTMLElement | null>;
  hasCollapsedCrumbs: boolean;
}

/** Room for the inline title once crumbs have collapsed: the trail's width
 * less the inline identifier (when shown) and the collapsed trail ahead of it. */
function titleSpace(refs: TitleSpaceRefs, fontSize: number): number | null {
  const container = refs.container.current;
  if (container == null) return null;
  let available = container.getBoundingClientRect().width;
  const ident = refs.identifier.current;
  if (ident != null && ident.getClientRects().length > 0) {
    const margin = parseFloat(getComputedStyle(ident).marginLeft) || 0;
    available -= ident.getBoundingClientRect().width + margin;
  }
  if (refs.hasCollapsedCrumbs) {
    available -= collapsedTrailWidth * fontSize;
  }
  return available;
}

/** Rungs of the title-first ladder: each gives the title more room. */
enum YieldLevel {
  None = 0,
  HideLabels = 1,
  HideIdentifier = 2,
  FoldActions = 3,
}

/** Default title reserve for `prioritizeTitle: true`, in ems. */
const defaultTitleReserve = 20;

/**
 * How far secondary content has stepped down so the title gets room for its
 * full form (or `reserve` ems, if that's less). Steps up while the title is
 * short of room. Steps down when the gain from the current rung — measured as
 * the title space it actually freed when it was taken — is no longer needed,
 * so the ladder settles without oscillating.
 */
function useYieldLevel(
  enabled: boolean,
  maxLevel: YieldLevel,
  reserve: number,
  refs: TitleSpaceRefs,
): YieldLevel {
  const [level, setLevel] = useState<YieldLevel>(YieldLevel.None);
  const gains = useRef<number[]>([]);
  const pending = useRef<{ from: YieldLevel; space: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const measurer = refs.measure;
    const container = refs.container.current;
    if (!enabled || measurer == null || container == null) {
      pending.current = null;
      setLevel(YieldLevel.None);
      return;
    }
    const measureEl: HTMLElement = measurer;
    const fullTitle = measureEl.children[0] as HTMLElement | undefined;

    function update() {
      const fontSize = parseFloat(getComputedStyle(measureEl).fontSize);
      const space = titleSpace(refs, fontSize);
      if (space == null || fullTitle == null) return;
      const titleWidth = fullTitle.getBoundingClientRect().width;
      const needed = Math.min(titleWidth, reserve * fontSize);

      // Record what the rung just taken actually freed.
      const step = pending.current;
      if (step != null && step.from == level - 1) {
        gains.current[level] = Math.max(space - step.space, 0);
      }
      pending.current = null;

      if (space < needed && level < maxLevel) {
        pending.current = { from: level, space };
        setLevel(level + 1);
        return;
      }
      if (level > YieldLevel.None) {
        const gain = gains.current[level] ?? Infinity;
        if (space - gain >= needed) {
          setLevel(level - 1);
        }
      }
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    if (fullTitle != null) observer.observe(fullTitle);
    return () => observer.disconnect();
  }, [
    enabled,
    level,
    maxLevel,
    reserve,
    refs.measure,
    refs.hasCollapsedCrumbs,
  ]);

  if (!enabled) return YieldLevel.None;
  return Math.min(level, maxLevel);
}

/** Index of the longest title form that fits the trail once its crumbs have
 * collapsed, re-measured whenever the trail or a form changes size. */
function useFittingTitle(
  forms: ReactNode[],
  mode: ShortenMode,
  enabled: boolean,
  refs: TitleSpaceRefs,
  remeasureKey?: unknown,
) {
  const [index, setIndex] = useState(0);
  const count = forms.length;
  // Re-measure when the forms' text changes, not on every new array identity.
  const formsKey = forms
    .map((form) => (typeof form == "string" ? form : "\u0000"))
    .join("\u0001");

  useIsomorphicLayoutEffect(() => {
    const measurer = refs.measure;
    const container = refs.container.current;
    if (!enabled || count <= 1 || measurer == null || container == null) {
      setIndex(0);
      return;
    }
    const measureEl: HTMLElement = measurer;
    const containerEl: HTMLElement = container;
    const formEls = Array.from(measureEl.children) as HTMLElement[];

    function update() {
      const fontSize = parseFloat(getComputedStyle(measureEl).fontSize);
      const available = titleSpace(refs, fontSize);
      if (available == null) return;
      const ix = fittingFormIndex(
        formEls.map((el) => el.textContent ?? ""),
        (_, i) => formEls[i].getBoundingClientRect().width,
        available,
        mode,
      );
      setIndex(ix);
    }

    update();
    // Forms change width as web fonts load; the trail as the page resizes.
    const observer = new ResizeObserver(update);
    observer.observe(containerEl);
    formEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [
    enabled,
    count,
    formsKey,
    mode,
    refs.measure,
    refs.hasCollapsedCrumbs,
    remeasureKey,
  ]);

  return Math.min(index, count - 1);
}

/** Width of a fully collapsed trail ahead of the title — the "…" menu button
 * and the chevron after it — in ems of the trail's type size. */
const collapsedTrailWidth = 3.75;

/** The header's actions folded behind a single "more" button. */
function ActionsDropdown({ content }) {
  return h(
    ToolbarDropdown,
    {
      content: h("div.actions-menu", content),
      placement: "bottom-end",
    },
    h(Button, {
      className: "actions-menu-button",
      icon: "more",
      variant: "minimal",
      "aria-label": "More actions",
    }),
  );
}

export type PageHeaderButtonProps = ToolbarButtonProps;

/** A header action whose label collapses to its icon when the header is
 * narrow, so actions give up width before the title has to. The same button
 * as `ToolbarButton`. */
export const PageHeaderButton = ToolbarButton;

/** Whether an element is narrower than `threshold` px; false when disabled. */
function useIsNarrower(
  ref: RefObject<HTMLElement | null>,
  threshold: number,
  enabled: boolean,
) {
  const [isNarrow, setIsNarrow] = useState(false);
  // Measured before paint, so a narrow bar never shows its unfolded actions
  // for a frame (on the client; a server render can't know the width).
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || el == null) return;
    const measure = () => {
      setIsNarrow(el.getBoundingClientRect().width < threshold);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, threshold]);
  return enabled && isNarrow;
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

  useIsomorphicLayoutEffect(() => {
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
