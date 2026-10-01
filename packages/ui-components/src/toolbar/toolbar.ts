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
import { ReactNode, RefObject, useMemo, useRef, useState } from "react";
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
/** How the bar sheds width: `never`; as needed (`narrow`: labels drop to
 * icons, then items fold into a "more" popover, lowest priority first); or
 * `always`, with every unpinned item in the popover. */
export type ToolbarCollapse = "never" | "narrow" | "always";

export interface ToolbarItem {
  id: string;
  content: ReactNode;
  /** What the overflow popover shows once folded. Defaults to `content`. */
  menuContent?: ReactNode;
  /** Higher stays in the bar longer. Default 0; ties fold rightmost first. */
  priority?: number;
  /** Never folds into the overflow popover. */
  pinned?: boolean;
}

/** Items (which can fold) or any content (which can't). */
export type ToolbarContent = ToolbarItem[] | ReactNode;

export interface ToolbarProps {
  /** Leading items: a title, view switchers, primary filters. */
  start?: ToolbarContent;
  /** Trailing items: global actions. */
  end?: ToolbarContent;
  /** Flexible middle, taking the leftover width: a search field, active
   * filter tags. Never folds; holds at least `--toolbar-content-min-width`. */
  children?: ReactNode;
  placement?: ToolbarPlacement;
  anchor?: ToolbarAnchor;
  align?: ToolbarAlign;
  surface?: ToolbarSurface;
  size?: "small" | "regular";
  collapse?: ToolbarCollapse;
  /** Drop `ToolbarButton` labels to icons before folding items. Default on. */
  dropLabels?: boolean;
  overflowIcon?: IconName;
  /** Visible label for the overflow button (e.g. "Filters"); icon only if
   * absent. */
  overflowLabel?: string;
  className?: string;
}

/**
 * A bar of controls for any page or content model: filter and sort tags,
 * view switchers, actions. Owns layout only — placement, surface and how it
 * sheds width — and leaves state to its contents.
 */
export function Toolbar(props: ToolbarProps) {
  const {
    start,
    end,
    children,
    placement = "inline",
    anchor = "top",
    surface = defaultSurface(placement),
    size = "regular",
    collapse = "never",
    dropLabels = true,
    overflowIcon = "more",
    overflowLabel,
    className,
  } = props;
  let { align } = props;
  align ??= defaultAlign(placement);

  const startItems = asItems(start, "start");
  const endItems = asItems(end, "end");
  const ladder = useMemo(
    () => buildLadder(startItems, endItems, dropLabels),
    [ladderKey(startItems, endItems, dropLabels)],
  );

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const level = useCollapseLevel(collapse, ladder, {
    outer: outerRef,
    inner: innerRef,
    middle: middleRef,
  });

  let applied = ladder.slice(0, level);
  if (collapse == "always") {
    // Every unpinned item in the popover; the pinned ones keep their labels.
    applied = ladder.filter((step) => step.type == "fold");
  }
  const labelsHidden = applied.some((step) => step.type == "labels");
  const folded = new Set(
    applied.filter((step) => step.type == "fold").map((step) => step.id),
  );
  const overflowItems = [...startItems, ...endItems].filter((item) =>
    folded.has(item.id),
  );

  return h(
    "div.toolbar",
    {
      ref: outerRef,
      className: classNames(
        placement,
        anchor,
        surface,
        size,
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
        h(ToolbarGroup, { items: startItems, folded, side: "start" }),
        h("div.toolbar-content", { ref: middleRef }, children),
        h(ToolbarGroup, { items: endItems, folded, side: "end" }),
        h.if(overflowItems.length > 0)(OverflowDropdown, {
          items: overflowItems,
          icon: overflowIcon,
          label: overflowLabel,
          small: size == "small",
        }),
      ],
    ),
  );
}

function ToolbarGroup({ items, folded, side }) {
  const shown = items.filter((item) => !folded.has(item.id));
  return h(
    "div.toolbar-group",
    { className: side },
    shown.map((item) => h("div.toolbar-item", { key: item.id }, item.content)),
  );
}

/** Folded items behind one button, in their bar order, with full labels (the
 * popover is outside the bar, so collapsed labels show again). */
function OverflowDropdown({ items, icon, label, small }) {
  const content = h(
    "div.toolbar-overflow-menu",
    items.map((item) =>
      h(
        "div.toolbar-overflow-item",
        { key: item.id },
        item.menuContent ?? item.content,
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
  /** Label that drops (leaving the icon) when the bar runs short of room.
   * Strings also become the button's accessible name. */
  text?: ReactNode;
  /** Render as a link (Blueprint `AnchorButton`) rather than a button. */
  href?: string;
  target?: string;
}

/**
 * A bar action whose label collapses to its icon when the bar (a `Toolbar` or
 * a `PageHeader`) is short of room, so actions give up width before content
 * has to.
 */
export function ToolbarButton(props: ToolbarButtonProps) {
  const { text, className, ...rest } = props;
  let ariaLabel: string | undefined = undefined;
  if (typeof text == "string") {
    ariaLabel = text;
  }
  let component: React.ComponentType<any> = Button;
  if (props.href != null) {
    component = AnchorButton;
  }
  // The label is found by attribute rather than class: an attribute survives
  // CSS-module scoping, so any bar's stylesheet can collapse it.
  return h(component, {
    "aria-label": ariaLabel,
    ...rest,
    className,
    text: h.if(text != null)("span", { "data-toolbar-label": "" }, text),
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
 */
export function FilterTag(props: FilterTagProps) {
  const {
    active = false,
    onClear,
    content,
    dropdownProps,
    className,
    large = true,
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

// Collapse ladder

type Step = { type: "labels" } | { type: "fold"; id: string };

/** The steps a narrowing bar takes, in order: labels to icons, then items
 * into the popover from lowest priority (and, among equals, rightmost). */
function buildLadder(
  startItems: ToolbarItem[],
  endItems: ToolbarItem[],
  dropLabels: boolean,
): Step[] {
  const all = [...startItems, ...endItems];
  const foldable = all
    .map((item, order) => ({ item, order }))
    .filter(({ item }) => !item.pinned)
    .sort(
      (a, b) =>
        (a.item.priority ?? 0) - (b.item.priority ?? 0) || b.order - a.order,
    );
  const steps: Step[] = [];
  if (dropLabels) {
    steps.push({ type: "labels" });
  }
  for (const { item } of foldable) {
    steps.push({ type: "fold", id: item.id });
  }
  return steps;
}

function ladderKey(start: ToolbarItem[], end: ToolbarItem[], labels: boolean) {
  const items = [...start, ...end].map(
    (i) => `${i.id}:${i.priority ?? 0}:${i.pinned ? 1 : 0}`,
  );
  return `${labels}|${items.join(",")}`;
}

interface CollapseRefs {
  outer: RefObject<HTMLElement | null>;
  inner: RefObject<HTMLElement | null>;
  middle: RefObject<HTMLElement | null>;
}

/**
 * How many ladder steps are taken. Steps forward while the bar's rigid
 * contents overrun the width it may fill; steps back when the room the last
 * step freed — measured as it was taken — fits in the slack again, so the bar
 * settles the same way growing or shrinking.
 */
function useCollapseLevel(
  collapse: ToolbarCollapse,
  ladder: Step[],
  refs: CollapseRefs,
): number {
  const [level, setLevel] = useState(0);
  const gains = useRef<number[]>([]);
  const pending = useRef<{ from: number; slack: number } | null>(null);
  const key = ladder.map((s) => (s.type == "fold" ? s.id : "labels")).join(",");

  useIsomorphicLayoutEffect(() => {
    gains.current = [];
    pending.current = null;
  }, [key]);

  useIsomorphicLayoutEffect(() => {
    if (collapse != "narrow") return;
    const outer = refs.outer.current;
    const inner = refs.inner.current;
    if (outer == null || inner == null) return;
    const outerEl: HTMLElement = outer;
    const innerEl: HTMLElement = inner;

    function update() {
      const slack = measureSlack(outerEl, innerEl, refs.middle.current);
      const step = pending.current;
      if (step != null && step.from == level - 1) {
        gains.current[level] = Math.max(slack - step.slack, 0);
      }
      pending.current = null;

      if (slack < -0.5 && level < ladder.length) {
        pending.current = { from: level, slack };
        setLevel(level + 1);
        return;
      }
      if (level > 0) {
        const gain = gains.current[level] ?? Infinity;
        if (gain <= slack) {
          setLevel(level - 1);
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
  }, [collapse, level, key]);

  if (collapse != "narrow") return 0;
  return Math.min(level, ladder.length);
}

/** Width left over once the bar's rigid parts and the middle's minimum are
 * laid out, against the full width the bar may fill. Negative = overrun. */
function measureSlack(
  outer: HTMLElement,
  inner: HTMLElement,
  middle: HTMLElement | null,
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

  let rigid = 0;
  let shown = 0;
  for (const child of Array.from(inner.children) as HTMLElement[]) {
    if (child.getClientRects().length == 0) continue;
    shown += 1;
    if (child == middle) continue;
    rigid += child.getBoundingClientRect().width;
  }
  let middleMin = 0;
  if (middle != null) {
    middleMin = parseFloat(getComputedStyle(middle).minWidth) || 0;
  }
  return available - padding - rigid - middleMin - gap * Math.max(shown - 1, 0);
}

// Helpers

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

function defaultSurface(placement: ToolbarPlacement): ToolbarSurface {
  if (placement == "floating" || placement == "fixed") return "raised";
  return "plain";
}

function defaultAlign(placement: ToolbarPlacement): ToolbarAlign {
  if (placement == "floating" || placement == "fixed") return "center";
  return "stretch";
}
