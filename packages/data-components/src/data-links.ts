import type {
  Environment,
  UnitLong,
  Lithology,
  Interval,
} from "@macrostrat/api-types";

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

export interface ItemInteractionResult {
  href?: string | null;
  target?: string;
  onClick?: (event: MouseEvent) => void;
}

export class MacrostratInteractionManager {
  domain: string;
  _builder: MacrostratItemInteractionBuilder;

  constructor(domain: string = "/") {
    this.domain = domain;
    this._builder = configureInteractionsForDomain(this.domain);
  }

  interactionPropsForItem(
    item: MacrostratItemIdentifier,
  ): ItemInteractionResult {
    return this._builder(item);
  }

  hrefForItem(item: MacrostratItemIdentifier): string | null {
    const result = this.interactionPropsForItem(item);
    return result.href || null;
  }

  clickHandlerForItem(
    item: MacrostratItemIdentifier,
  ): ((event: MouseEvent) => void) | undefined {
    const result = this.interactionPropsForItem(item);
    return result.onClick;
  }
}

export type MacrostratItemInteractionBuilder = (
  item: MacrostratItemIdentifier,
) => ItemInteractionResult;

export function configureInteractionsForDomain(
  domain: string = "/",
): MacrostratItemInteractionBuilder {
  /** Create a link builder function for Macrostrat items */
  return function linkBuilder(
    item: MacrostratItemIdentifier,
  ): ItemInteractionResult {
    let href = createItemHref(item);
    if (href != null && domain != "/") {
      if (!href.startsWith("/")) {
        href = "/" + href;
      }
      href = domain + href;
    }
    return {
      href,
      target: defaultLinkTarget(href),
    };
  };
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
