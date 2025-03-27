import { useInDarkMode } from "@macrostrat/ui-components";
import hyper from "@macrostrat/hyper";
import { getLuminanceAdjustedColorScheme } from "@macrostrat/color-utils";
import styles from "./lithology-tag.module.sass";
import { DataField } from "./index";
import { ReactNode } from "react";
import chroma from "chroma-js";

const h = hyper.styled(styles);

export enum TagSize {
  Small = "small",
  Normal = "normal",
  Large = "large",
}

interface BaseTagProps {
  prefix?: ReactNode;
  name: ReactNode;
  details?: ReactNode;
  classNames?: {
    prefix?: string;
    details?: string;
    main?: string;
  };
  className: string;
  children?: ReactNode;
  size?: TagSize;
  color?: chroma.ChromaInput;
}

export function BaseTag(props: BaseTagProps) {
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

interface LithologyTagProps {
  data: any;
  color?: chroma.ChromaInput;
  className?: string;
  expandOnHover?: boolean;
  showProportion?: boolean;
  showAttributes?: boolean;
  size?: TagSize;
}

export function LithologyTag({
  data,
  color,
  showProportion = true,
  showAttributes = false,
  size,
}: LithologyTagProps) {
  const inDarkMode = useInDarkMode();

  let proportion = null;
  if (data.prop != null && showProportion) {
    const prop = Math.round(data.prop * 100);
    proportion = h("span.lithology-proportion", `${prop}%`);
  }

  let atts = null;
  if (showAttributes && data.atts != null && data.atts.length > 0) {
    atts = data.atts.map((att) => {
      return h("span.lithology-attribute", att);
    });
    atts = commaSeparated(atts);
  }

  return h(BaseTag, {
    prefix: atts,
    details: proportion,
    name: data.name,
    className: "lithology-tag",
    size,
    color: color ?? data.color,
  });
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

function commaSeparated(children) {
  return children.reduce((acc, el, i) => {
    if (i > 0) {
      acc.push(h("span.lithology-attribute-sep", ", "));
    }
    acc.push(el);
    return acc;
  }, []);
}

export function LithologyList({
  lithologies,
  lithologyMap,
  showProportions = false,
  showAttributes = false,
}: {
  lithologies: any[];
  lithologyMap?: Map<number, any>;
  showProportions?: boolean;
}) {
  return h(
    DataField,
    { label: "Lithologies" },
    h(
      ItemList,
      { className: "lithology-list" },
      lithologies
        .toSorted((a, b) => {
          let dx = (b.prop ?? 0) - (a.prop ?? 0);
          if (dx == 0) {
            dx = (b.atts?.length ?? 0) - (a.atts?.length ?? 0);
          }
          if (dx == 0) {
            return a.name.localeCompare(b.name);
          }
          return dx;
        })
        .map((lith) => {
          let color = lithologyMap?.get(lith.lith_id)?.color;
          return h(LithologyTag, {
            data: lith,
            color,
            showProportion: showProportions,
            showAttributes: showAttributes,
          });
        })
    )
  );
}

export function ItemList({
  children,
  className,
}: {
  children?: ReactNode;
  className: string;
}) {
  return h("span.item-list", { className }, children);
}

export function EnvironmentsList({ environments }) {
  return h(
    DataField,
    { label: "Environments" },
    h(
      ItemList,
      { className: "environments-list" },
      environments.map((lith: any) => {
        return h(LithologyTag, { data: lith });
      })
    )
  );
}
