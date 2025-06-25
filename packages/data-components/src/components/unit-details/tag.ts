import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { getLuminanceAdjustedColorScheme } from "@macrostrat/color-utils";
import styles from "./tag.module.sass";
import { ComponentType, ReactNode, JSX } from "react";
import chroma from "chroma-js";
import classNames from "classnames";

const h = hyper.styled(styles);

export enum TagSize {
  Small = "small",
  Normal = "normal",
  Large = "large",
}

export interface BaseTagProps {
  prefix?: ReactNode;
  name: ReactNode;
  details?: ReactNode;
  classNames?: {
    prefix?: string;
    details?: string;
    main?: string;
  };
  className?: string;
  children?: ReactNode;
  size?: TagSize;
  color?: chroma.ChromaInput;
  onClick?: (event: MouseEvent) => void;
  href?: string;
  component?: ComponentOrHTMLTagElement<any>;
}

export type ComponentOrHTMLTagElement<T> =
  | ComponentType<T>
  | keyof JSX.IntrinsicElements;

export function Tag(props: BaseTagProps) {
  const inDarkMode = useInDarkMode();
  const {
    prefix,
    name,
    details,
    className,
    children,
    size,
    color,
    onClick,
    href,
    component,
  } = props;

  let classes = props.classNames ?? {};

  let _component: ComponentOrHTMLTagElement<any> = component ?? "span";
  if (href != null && component == null) {
    // If a href is provided, use an anchor tag by default
    _component = "a";
  }

  // TODO: details and prefix might be better moved outside of the component...
  let _details = null;
  if (details != null) {
    _details = h("span.details", { className: classes.details }, details);
  }

  const mainTag = h("span.main", { className: classes.main }, [
    h("span.name", name),
    children,
    _details,
  ]);

  let _prefix = null;
  if (prefix != null) {
    _prefix = h("span.prefix", { className: classes.prefix }, prefix);
  }

  return h(
    _component,
    {
      className: classNames(className, "tag"),
      style: buildTagStyle({ color, size, inDarkMode }),
      onClick,
    },
    [_prefix, mainTag]
  );
}

interface TagStyleProps {
  color?: chroma.ChromaInput;
  size?: TagSize;
  inDarkMode?: boolean;
}

function buildTagStyle({ color, size, inDarkMode }: TagStyleProps = {}) {
  const scheme: any = getLuminanceAdjustedColorScheme(color, inDarkMode);

  let fontSize: string | null = null;
  if (size === TagSize.Small) {
    fontSize = "12px";
  } else if (size === TagSize.Normal) {
    fontSize = "1em";
  } else if (size === TagSize.Large) {
    fontSize = "1.4em";
  }

  let style: Record<string, string> = {};

  if (fontSize != null) {
    style = { ...style, "--font-size": fontSize };
  }

  if (color != null) {
    style = {
      ...style,
      "--text-color": scheme.mainColor,
      "--tag-background": scheme.backgroundColor,
      "--secondary-color": scheme.secondaryColor,
      "--tag-secondary-background": scheme.secondaryBackgroundColor,
    };
  }

  return style;
}

export function BaseTagList({
  children,
  className,
}: {
  children?: ReactNode;
  className: string;
}) {
  return h("span.tag-list", { className }, children);
}

export const ItemList = BaseTagList;
