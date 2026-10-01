import {
  AnchorButton,
  Button,
  ButtonProps,
  IconName,
  MenuDivider,
  PopoverNext,
  Tag,
  TagProps,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsomorphicLayoutEffect } from "../util/isomorphic-layout-effect";
import styles from "./toolbar.module.sass";

const h = hyper.styled(styles);

/**
 * - `inline`: in the flow of the page, like any block.
 * - `sticky`: in the flow, then held at the `anchor` edge of its scroll
 *   container (offset by `--toolbar-offset`, e.g. a page header's height).
 * - `floating`: lifted over its nearest positioned ancestor (a map, a list),
 *   inset by `--toolbar-inset`.
 * - `fixed`: lifted over the viewport, clear of the phone's safe areas.
 */
export type ToolbarPlacement = "inline" | "sticky" | "floating" | "fixed";
export type ToolbarAnchor = "top" | "bottom";
/** `plain` has no chrome (it takes the page colour when sticky); `bordered`
 * is a band with a rule on its inner edge; `raised` is a lifted, rounded
 * panel — the default when floating or fixed. */
export type ToolbarSurface = "plain" | "bordered" | "raised";
/** Where the bar sits along its edge when it doesn't fill it. `stretch` (the
 * default inline and sticky) spans the edge; the others size to the content. */
export type ToolbarAlign = "start" | "center" | "end" | "stretch";
/**
 * How much room the bar's contents take, at most:
 * - `expanded`: full-size controls with their labels.
 * - `compact`: smaller controls, buttons as icons — the size of a page
 *   header's actions.
 * - `collapsed`: compact, with every foldable item in the "more" popover.
 * Tags and buttons in the bar read it (`useToolbarDensity`) to size
 * themselves.
 */
export type ToolbarDensity = "expanded" | "compact" | "collapsed";
/** Whether the bar adapts down from its `density` as it narrows: `narrow`
 * (default) drops labels to icons, then folds items into the popover, lowest
 * priority first, while growing fields shrink in step; `never` holds it. */
export type ToolbarCollapse = "never" | "narrow";

export interface ToolbarItem {
  id: string;
  content: ReactNode;
  /** What the overflow popover shows once folded. Defaults to `content`. */
  menuContent?: ReactNode;
  /** Higher stays in the bar longer. Default 0; ties fold rightmost first. */
  priority?: number;
  /** Never folds into the overflow popover. */
  pinned?: boolean;
  /** A flexible field (a search box): takes the leftover width and shrinks,
   * between `--toolbar-grow-ideal-width` and `--toolbar-grow-min-width`,
   * rather than folding. As the bar narrows it gives up width in step with
   * the other items' collapsing, not all before or all after it. */
  grow?: boolean;
}

/** Items (in bar order), or any content (one pinned item). */
export type ToolbarContent = ToolbarItem[] | ReactNode;

export interface ToolbarProps {
  /** Leading items, in order: filters, a search field, sorts. */
  start?: ToolbarContent;
  /** Trailing items, pushed to the end: global actions. */
  end?: ToolbarContent;
  /** Shorthand for a growing field between `start` and `end`. */
  children?: ReactNode;
  placement?: ToolbarPlacement;
  anchor?: ToolbarAnchor;
  align?: ToolbarAlign;
  surface?: ToolbarSurface;
  density?: ToolbarDensity;
  collapse?: ToolbarCollapse;
  overflowIcon?: IconName;
  /** Visible label for the overflow button (e.g. "Filters"); icon only if
   * absent. */
  overflowLabel?: string;
  className?: string;
}

const ToolbarContext = createContext<ToolbarDensity | null>(null);

/** The density of the enclosing `Toolbar` (null outside one), for controls
 * that size themselves to the bar. */
export function useToolbarDensity(): ToolbarDensity | null {
  return useContext(ToolbarContext);
}

/**
 * A bar of controls for any page or content model: filter and sort tags,
 * search, view switchers, actions. Owns layout only — placement, surface,
 * density and how it sheds width — and leaves state to its contents.
 */
export function Toolbar(props: ToolbarProps) {
  const {
    start,
    end,
    children,
    placement = "inline",
    anchor = "top",
    surface = defaultSurface(placement),
    density = "expanded",
    collapse = "narrow",
    overflowIcon = "more",
    overflowLabel,
    className,
  } = props;
  let { align } = props;
  align ??= defaultAlign(placement);

  const items = placeItems(start, end, children);
  const ladder = useMemo(() => buildLadder(items), [ladderKey(items)]);
  let base = 0;
  if (density == "compact") {
    base = 1;
  } else if (density == "collapsed") {
    base = ladder.length;
  }

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const level = useCollapseLevel(collapse == "narrow", base, ladder, {
    outer: outerRef,
    inner: innerRef,
  });

  const applied = ladder.slice(0, level);
  const labelsHidden = applied.some((step) => step.type == "labels");
  const folded = new Set(
    applied.filter((step) => step.type == "fold").map((step) => step.id),
  );
  const shown = items.filter((entry) => !folded.has(entry.item.id));
  const overflowItems = items
    .filter((entry) => folded.has(entry.item.id))
    .map((entry) => entry.item);

  let contentDensity: ToolbarDensity = "expanded";
  if (density != "expanded") {
    contentDensity = "compact";
  }

  return h(
    ToolbarContext.Provider,
    { value: contentDensity },
    h(
      "div.toolbar",
      {
        ref: outerRef,
        className: classNames(
          placement,
          anchor,
          surface,
          contentDensity,
          "align-" + align,
          className,
        ),
      },
      h(
        "div.toolbar-inner",
        {
          ref: innerRef,
          role: "toolbar",
          className: classNames({ "labels-hidden": labelsHidden }),
        },
        [
          ...shown.map(({ item, side }, i) =>
            h(
              "div.toolbar-item",
              {
                key: item.id,
                // Read by the collapse measure, which can't see scoped classes.
                "data-grow": item.grow ? "" : undefined,
                className: classNames({
                  grow: item.grow,
                  // The first trailing item takes up the slack, pushing the
                  // rest of `end` over (a growing field, if any, fills it).
                  "end-start": side == "end" && shown[i - 1]?.side != "end",
                }),
              },
              item.content,
            ),
          ),
          h.if(overflowItems.length > 0)(OverflowDropdown, {
            key: "overflow",
            items: overflowItems,
            icon: overflowIcon,
            label: overflowLabel,
            small: contentDensity == "compact",
          }),
        ],
      ),
    ),
  );
}

/** Folded items behind one button, in their bar order, at full size and with
 * their labels (the popover is outside the bar). */
function OverflowDropdown({ items, icon, label, small }) {
  const content = h(
    ToolbarContext.Provider,
    { value: "expanded" },
    h(
      "div.toolbar-overflow-menu",
      items.map((item) =>
        h(
          "div.toolbar-overflow-item",
          { key: item.id },
          item.menuContent ?? item.content,
        ),
      ),
    ),
  );
  return h(
    ToolbarDropdown,
    { content, placement: "bottom-end" },
    h(Button, {
      className: "toolbar-overflow-button",
      icon,
      text: label,
      variant: "minimal",
      small,
      "aria-label": label ?? "More controls",
    }),
  );
}

export interface ToolbarButtonProps extends ButtonProps {
  /** Label that drops (leaving the icon) when the bar runs short of room, or
   * is compact. Strings also become the button's accessible name. */
  text?: ReactNode;
  /** Render as a link (Blueprint `AnchorButton`) rather than a button. */
  href?: string;
  target?: string;
}

/**
 * A bar action whose label collapses to its icon when the bar (a `Toolbar` or
 * a `PageHeader`) is short of room, so actions give up width before content
 * has to. In a compact toolbar it is small and icon-only.
 */
export function ToolbarButton(props: ToolbarButtonProps) {
  const { text, className, ...rest } = props;
  const density = useToolbarDensity();
  let ariaLabel: string | undefined = undefined;
  if (typeof text == "string") {
    ariaLabel = text;
  }
  let component: React.ComponentType<any> = Button;
  if (props.href != null) {
    component = AnchorButton;
  }
  let label: ReactNode = null;
  if (text != null && density != "compact") {
    // Found by attribute rather than class: an attribute survives CSS-module
    // scoping, so any bar's stylesheet can collapse it.
    label = h("span", { "data-toolbar-label": "" }, text);
  }
  let title: string | undefined = undefined;
  if (label == null) {
    title = ariaLabel;
  }
  return h(component, {
    "aria-label": ariaLabel,
    title,
    small: density == "compact",
    ...rest,
    className,
    text: label,
  });
}

/**
 * A dropdown for a panel of controls, not just menu items. Deliberately
 * **not** focus-trapping: these panels hold real form controls, and a control
 * whose typeahead renders in its own portal (a `MultiSelect`, a date picker)
 * has focus yanked back out by an enclosing trap. Caller props pass through.
 */
export function ToolbarDropdown({ children, content, ...props }: any) {
  return h(
    PopoverNext,
    {
      content,
      placement: "bottom-start",
      enforceFocus: false,
      autoFocus: false,
      arrow: false,
      ...props,
    },
    children,
  );
}

export interface FilterTagProps extends Omit<
  TagProps,
  "onRemove" | "active" | "content"
> {
  /** Whether the control it opens is in effect: shown in the primary intent,
   * with a ✕ (when `onClear` is given) in place of the caret. */
  active?: boolean;
  onClear?: () => void;
  /** The dropdown it opens: a menu, a filter form. */
  content?: ReactNode;
  /** Props for the dropdown (placement, controlled `isOpen`, …). */
  dropdownProps?: object;
}

/**
 * The tag that stands for a filter, a sort or a view control in a bar: a
 * caret while it opens something, the primary intent and a clear ✕ once it's
 * in effect. The same look for any content model, whatever holds its state.
 * Large in an expanded bar (or outside one), regular in a compact one.
 */
export function FilterTag(props: FilterTagProps) {
  const density = useToolbarDensity();
  const {
    active = false,
    onClear,
    content,
    dropdownProps,
    className,
    large = density != "compact",
    children,
    ...rest
  } = props;

  let rightIcon: IconName | undefined = undefined;
  if (content != null && !active) {
    rightIcon = "caret-down";
  }
  let onRemove: TagProps["onRemove"] = undefined;
  if (active && onClear != null) {
    onRemove = (evt) => {
      evt.stopPropagation();
      onClear();
    };
  }
  let intent: TagProps["intent"] = "none";
  if (active) {
    intent = "primary";
  }

  const tag = h(
    Tag,
    {
      minimal: true,
      large,
      rightIcon,
      intent,
      onRemove,
      interactive: content != null,
      ...rest,
      className: classNames("filter-tag", { active }, className),
    },
    children,
  );
  if (content == null) return tag;
  return h(ToolbarDropdown, { content, ...dropdownProps }, tag);
}

/**
 * A titled block *inside* a menu holding an arbitrary form, rather than a menu
 * item that opens a submenu — one click away instead of two, with no nested
 * popover to lose focus to.
 */
export function MenuFormItem({
  title,
  children,
}: {
  title?: ReactNode;
  children: ReactNode;
}) {
  return h("li.menu-form-item", [
    h.if(title != null)(MenuDivider, { title }),
    h("div.menu-form-body", children),
  ]);
}

// Items

interface PlacedItem {
  item: ToolbarItem;
  side: "start" | "middle" | "end";
}

function placeItems(
  start: ToolbarContent,
  end: ToolbarContent,
  children: ReactNode,
): PlacedItem[] {
  const placed: PlacedItem[] = [];
  for (const item of asItems(start, "start")) {
    placed.push({ item, side: "start" });
  }
  if (children != null && children !== false) {
    placed.push({
      item: { id: "toolbar-content", content: children, grow: true },
      side: "middle",
    });
  }
  for (const item of asItems(end, "end")) {
    placed.push({ item, side: "end" });
  }
  return placed;
}

function asItems(content: ToolbarContent, side: string): ToolbarItem[] {
  if (content == null || content === false) return [];
  if (Array.isArray(content) && content.every(isToolbarItem)) {
    return content as ToolbarItem[];
  }
  // Plain content is one item that never folds.
  return [
    { id: `${side}-content`, content: content as ReactNode, pinned: true },
  ];
}

function isToolbarItem(value: unknown): value is ToolbarItem {
  return (
    value != null &&
    typeof value == "object" &&
    "id" in value &&
    "content" in value &&
    !("$$typeof" in value)
  );
}

// Collapse ladder

type Step = { type: "labels" } | { type: "fold"; id: string };

/** The steps a narrowing bar takes, in order: labels to icons, then items
 * into the popover from lowest priority (and, among equals, rightmost).
 * Growing fields never fold; they shrink. */
function buildLadder(items: PlacedItem[]): Step[] {
  const foldable = items
    .map(({ item }, order) => ({ item, order }))
    .filter(({ item }) => !item.pinned && !item.grow)
    .sort(
      (a, b) =>
        (a.item.priority ?? 0) - (b.item.priority ?? 0) || b.order - a.order,
    );
  const steps: Step[] = [{ type: "labels" }];
  for (const { item } of foldable) {
    steps.push({ type: "fold", id: item.id });
  }
  return steps;
}

function ladderKey(items: PlacedItem[]) {
  return items
    .map(
      ({ item }) =>
        `${item.id}:${item.priority ?? 0}:${item.pinned ? 1 : 0}:${item.grow ? 1 : 0}`,
    )
    .join(",");
}

interface CollapseRefs {
  outer: RefObject<HTMLElement | null>;
  inner: RefObject<HTMLElement | null>;
}

/**
 * How many ladder steps are taken (never fewer than `base`, the density's
 * starting point). Step `k` is taken when the bar's contents no longer fit
 * with growing fields at `threshold(k)` — a width stepped down from their
 * ideal toward their minimum across the ladder, so fields and items give way
 * in turn. A step is undone when the room it freed (measured as it was taken)
 * fits in the slack again, so the bar settles the same way growing or
 * shrinking.
 */
function useCollapseLevel(
  enabled: boolean,
  base: number,
  ladder: Step[],
  refs: CollapseRefs,
): number {
  const [level, setLevel] = useState(base);
  const gains = useRef<number[]>([]);
  const pending = useRef<{ from: number; slack: number } | null>(null);
  const total = ladder.length;
  const key = ladder.map((s) => (s.type == "fold" ? s.id : "labels")).join(",");

  useIsomorphicLayoutEffect(() => {
    gains.current = [];
    pending.current = null;
    setLevel(base);
  }, [key, base]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    const outer = refs.outer.current;
    const inner = refs.inner.current;
    if (outer == null || inner == null) return;
    const outerEl: HTMLElement = outer;
    const innerEl: HTMLElement = inner;
    // Where growing fields stand when step `k` is weighed: 1 = ideal width,
    // 0 = minimum, spread evenly over the steps above `base`.
    const fraction = (k: number) => (total - k) / (total - base + 1);

    function update() {
      const current = Math.max(level, base);
      const slackAt = (k: number) =>
        measureSlack(outerEl, innerEl, fraction(Math.min(k, total)));

      const step = pending.current;
      if (step != null && step.from == current - 1) {
        gains.current[current] = Math.max(slackAt(current - 1) - step.slack, 0);
      }
      pending.current = null;

      if (current < total && slackAt(current) < -0.5) {
        pending.current = { from: current, slack: slackAt(current) };
        setLevel(current + 1);
        return;
      }
      if (current > base) {
        const gain = gains.current[current] ?? Infinity;
        if (slackAt(current - 1) - gain >= 0) {
          setLevel(current - 1);
        }
      }
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(outerEl);
    for (const child of Array.from(innerEl.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [enabled, level, key, base]);

  if (!enabled) return base;
  return Math.min(Math.max(level, base), total);
}

/**
 * Width left over against the full width the bar may fill, once its rigid
 * items are laid out and growing fields hold `fraction` of the way from their
 * minimum to their ideal width. Negative = they don't fit.
 */
function measureSlack(
  outer: HTMLElement,
  inner: HTMLElement,
  fraction: number,
): number {
  const outerStyle = getComputedStyle(outer);
  const available =
    outer.clientWidth -
    (parseFloat(outerStyle.paddingLeft) || 0) -
    (parseFloat(outerStyle.paddingRight) || 0);
  const innerStyle = getComputedStyle(inner);
  const gap = parseFloat(innerStyle.columnGap) || 0;
  const padding =
    (parseFloat(innerStyle.paddingLeft) || 0) +
    (parseFloat(innerStyle.paddingRight) || 0);

  let used = 0;
  let shown = 0;
  for (const child of Array.from(inner.children) as HTMLElement[]) {
    if (child.getClientRects().length == 0) continue;
    shown += 1;
    if (child.dataset.grow != null) {
      const style = getComputedStyle(child);
      const min = parseFloat(style.minWidth) || 0;
      const ideal = Math.max(parseFloat(style.flexBasis) || min, min);
      used += min + (ideal - min) * fraction;
    } else {
      used += child.getBoundingClientRect().width;
    }
  }
  return available - padding - used - gap * Math.max(shown - 1, 0);
}

function defaultSurface(placement: ToolbarPlacement): ToolbarSurface {
  if (placement == "floating" || placement == "fixed") return "raised";
  return "plain";
}

function defaultAlign(placement: ToolbarPlacement): ToolbarAlign {
  if (placement == "floating" || placement == "fixed") return "center";
  return "stretch";
}
