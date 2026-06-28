import { isClickable, ItemInteractionProps } from "@macrostrat/data-components";
import h from "./panel.module.sass";
import { ReactNode } from "react";
import classNames from "classnames";

export function ClickableText({
  className,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & ItemInteractionProps) {
  /** An optionally clickable text element */
  const clickable = isClickable(rest);
  const tag = clickable ? "a" : "span";
  return h(tag, { className: classNames(className, { clickable }), ...rest });
}

export function Identifier({
  id,
  className,
  ...rest
}: {
  id: number | string;
  className?: string;
} & ItemInteractionProps) {
  /** An item that displays a numeric identifier, optionally clickable */
  return h(
    ClickableText,
    {
      className: classNames("identifier", className),
      ...rest,
    },
    id,
  );
}

export type UnitInfo = {
  unitID: number;
  colID?: number;
  name?: string;
};

export function UnitIdentifier({
  unitID,
  colID,
  name,
  ...interactionProps
}: UnitInfo & ItemInteractionProps) {
  if (name != null) {
    return h(
      ClickableText,
      {
        className: "unit-name",
        ...interactionProps,
      },
      name,
    );
  }

  return h(Identifier, {
    className: "unit-id",
    key: unitID,
    id: unitID,
    ...interactionProps,
  });
}
