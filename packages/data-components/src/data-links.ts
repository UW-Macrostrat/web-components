import type {
  Environment,
  UnitLong,
  Lithology,
  Interval,
} from "@macrostrat/api-types";
import { createScopedStore } from "./utils";
import { atom } from "jotai";
import { ReactNode, useMemo } from "react";
import h from "@macrostrat/hyper";

export type MacrostratItemIdentifier =
  | Lithology
  | Environment
  | UnitLong
  | Interval
  | {
      strat_name_id: number;
    }
  | { lith_id: number }
  | { environ_id: number }
  | { unit_id: number }
  | { int_id: number }
  | { project_id: number }
  | { col_id: number; unit_id?: number; project_id?: number };

export interface ItemInteractionProps {
  href?: string | null;
  target?: string;
  onClick?: (event: MouseEvent) => void;
}

type HrefBuilder = (item: MacrostratItemIdentifier) => string | null;
type ClickHandlerBuilder = (
  item: MacrostratItemIdentifier,
) => ((event: MouseEvent) => void) | undefined;

export interface MacrostratInteractionCtx {
  interactionPropsForItem: MacrostratItemInteractionBuilder;
}

export type MacrostratItemInteractionBuilder = (
  item: MacrostratItemIdentifier,
) => ItemInteractionProps;

/** Begin: Store */

const scope = createScopedStore();

const interactionManagerAtom = atom<MacrostratInteractionManager>();

export function MacrostratInteractionProvider({
  children,
  inherit = true,
  ...opts
}: InteractionManagerOptions & {
  children: ReactNode;
  inherit?: boolean;
}) {
  /** Context provider for MacrostratInteractionManager */
  const parent = scope.useAtomValueIfExists(interactionManagerAtom);
  const manager = useMemo(() => {
    return new MacrostratInteractionManager({
      ...opts,
      parent: inherit ? parent : null,
    });
  }, [parent, inherit, opts]);

  console.log(manager);
  return h(
    scope.Provider,
    {
      atoms: [[interactionManagerAtom, manager]],
      inherit: false,
      keepUpdated: false,
    },
    children,
  );
}

export function useInteractionProps(
  item: MacrostratItemIdentifier,
  interactive: boolean = true,
): ItemInteractionProps {
  const manager = scope.useAtomValueIfExists(interactionManagerAtom);
  return useMemo(() => {
    if (!interactive) {
      return {};
    }
    return manager?.interactionPropsForItem(item) ?? {};
  }, [interactive, manager, ...Object.values(item)]);
}

interface InteractionManagerOptions {
  domain?: string;
  hrefForItem?: (item: MacrostratItemIdentifier) => string | null;
  clickHandlerForItem?: (
    item: MacrostratItemIdentifier,
  ) => ((event: MouseEvent) => void) | undefined;
  targetForItem?: (
    item: MacrostratItemIdentifier,
    href: string,
  ) => string | undefined;
  interactionPropsForItem?: MacrostratItemInteractionBuilder;
}

export class MacrostratInteractionManager implements MacrostratInteractionCtx {
  /** Class to build interaction properties (links, click handlers, etc.) for Macrostrat items */
  readonly #domain: string;
  readonly #hrefForItem: HrefBuilder | undefined;
  readonly #clickHandlerForItem: ClickHandlerBuilder | undefined;
  readonly #interactionPropsForItem:
    | MacrostratItemInteractionBuilder
    | undefined;
  readonly #parent: MacrostratInteractionManager | null;
  readonly #targetForItem: (
    item: MacrostratItemIdentifier,
    href: string,
  ) => string;

  constructor(
    options: InteractionManagerOptions & {
      parent?: MacrostratInteractionManager | null;
    } = {},
  ) {
    const {
      domain = "/",
      hrefForItem,
      clickHandlerForItem,
      interactionPropsForItem,
      targetForItem,
      parent = null,
    } = options;
    this.#domain = domain;
    this.#hrefForItem = hrefForItem;
    this.#targetForItem = targetForItem;
    this.#clickHandlerForItem = clickHandlerForItem;
    this.#interactionPropsForItem = interactionPropsForItem;
    this.#parent = parent;
  }

  interactionPropsForItem(
    item: MacrostratItemIdentifier,
  ): ItemInteractionProps {
    let res: ItemInteractionProps = {
      href: undefined,
      target: undefined,
      onClick: undefined,
    };

    // If there's a parent item, defer to it for defaults
    res = this.#parent?.interactionPropsForItem(item) ?? res;

    // If there are custom interaction props, use them and then return
    if (this.#interactionPropsForItem != null) {
      const customProps = this.#interactionPropsForItem(item) ?? {};
      console.log("Applying custom props");
      return {
        ...res,
        ...customProps,
      };
    }

    // If there's a custom click handler, use it
    if (this.#clickHandlerForItem != null) {
      const onClick = this.#clickHandlerForItem(item);
      if (onClick != null) {
        res.onClick = onClick;
      }
    }

    // If there's a custom href builder, use it
    const href = this.#hrefForItem?.(item) ?? this._defaultHrefForItem(item);
    console.log("Applying custom href", href);
    if (href != null) {
      res.href = href;
      res.target = this.#targetForItem?.(item, href) ?? defaultLinkTarget(href);
    }

    console.log(res);

    return res;
  }

  private _defaultHrefForItem(item: MacrostratItemIdentifier): string | null {
    let href = createItemHref(item);
    if (href != null && this.#domain != "/") {
      if (!href.startsWith("/")) {
        href = "/" + href;
      }
      href = this.#domain + href;
    }
    return href;
  }
}

function createItemHref(item: MacrostratItemIdentifier): string {
  /** Build a relative link to a Macrostrat item. Designed for the URL
   * structure of Macrostrat's v2 website */
  if ("strat_name_id" in item) {
    return `/lex/strat-names/${item.strat_name_id}`;
  } else if ("lith_id" in item) {
    return `/lex/lithologies/${item.lith_id}`;
  } else if ("environ_id" in item) {
    return `/lex/environments/${item.environ_id}`;
  } else if ("col_id" in item) {
    let href = `/columns/${item.col_id}`;
    if (item.project_id != null) {
      href = `/projects/${item.project_id}` + href;
    }
    if (item.unit_id != null) {
      href += `#unit=${item.unit_id}`;
    }
  } else if ("unit_id" in item) {
    return `/lex/units/${item.unit_id}`;
  } else if ("int_id" in item) {
    return `/lex/intervals/${item.int_id}`;
  } else if ("project_id" in item) {
    return `/projects/${item.project_id}`;
  }
  return null;
}

function defaultLinkTarget(href: string | undefined) {
  if (href == null) return undefined;
  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:");
  if (isExternal) {
    return "_blank";
  }
  return undefined;
}
