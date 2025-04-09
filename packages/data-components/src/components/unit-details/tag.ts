import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { getLuminanceAdjustedColorScheme } from "@macrostrat/color-utils";
import styles from "./tag.module.sass";
import { ReactNode } from "react";
import chroma from "chroma-js";

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
}

export function Tag(props: BaseTagProps) {
  const inDarkMode = useInDarkMode();
  const {
    prefix,
    name,
    details,
    classNames = {},
    className,
    children,
    size,
    color,
  } = props;

  let _details = null;
  if (details != null) {
    _details = h("span.details", { className: classNames.details }, details);
  }

  const mainTag = h("span.main", { className: classNames.main }, [
    h("span.name", name),
    children,
    _details,
  ]);

  let _prefix = null;
  if (prefix != null) {
    _prefix = h("span.prefix", { className: classNames.prefix }, prefix);
  }

  return h(
    "span.tag",
    {
      className,
      style: buildTagStyle({ color, size, inDarkMode }),
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
      "--text-color": scheme.textColor,
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
