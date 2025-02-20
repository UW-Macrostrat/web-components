import hyper from "@macrostrat/hyper";
import { IconName, MenuItem, Spinner, Button } from "@blueprintjs/core";
import { ComponentType, MouseEventHandler, ReactNode } from "react";
import { Select } from "@blueprintjs/select";
import styles from "./index.module.sass";

const h = hyper.styled(styles);

/** A generic select component for selecting an item from a list */
export function ItemSelect<T extends Nameable>({
  items,
  selectedItem,
  onSelectItem,
  label = "item",
  icon = null,
  itemComponent = DefaultItemComponent,
  className,
  filterable = false,
  minimal = true,
  usePortal = true,
  nullable = false,
}: {
  items: T[] | null;
  selectedItem: T | null;
  onSelectItem(item: T | null): void;
  label: string;
  icon: IconName | ReactNode | null;
  itemComponent?: ComponentType<ItemComponentProps<T>>;
  className?: string;
  filterable?: boolean;
  minimal?: boolean;
  usePortal?: boolean;
  nullable?: boolean;
}) {
  let placeholder = `Select ${singularReferent(label)}`;
  let _icon: IconName | ReactNode = icon;
  if (items == null) {
    _icon = h(Spinner);
    placeholder = "Loading...";
  }
  let content: ReactNode = h(MenuItem, {
    icon: _icon,
    text: placeholder,
    className: "placeholder",
  });
  if (selectedItem != null) {
    content = h(itemComponent, {
      item: selectedItem,
      icon,
    });
  }

  return h(
    "div.item-select-container",
    { className },
    h(
      Select<T>,
      {
        items: items ?? [],
        itemRenderer: (item, { handleClick }) => {
          return h(itemComponent, { item, onClick: handleClick, icon });
        },
        onItemSelect: onSelectItem,
        popoverProps: {
          minimal,
          usePortal,
          matchTargetWidth: true,
        },
        filterable,
        fill: true,
      },
      h("div.target-container", [
        h("ul.target-select", content),
        h.if(nullable)(Button, {
          minimal: true,
          icon: "cross",
          intent: "danger",
          onClick(evt) {
            onSelectItem(null);
            evt.stopPropagation();
          },
          disabled: selectedItem == null,
        }),
      ])
    )
  );
}

interface Nameable {
  name: string;
  icon?: IconName | ReactNode;
}

interface ItemComponentProps<T> {
  item: T;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  icon?: IconName | ReactNode;
}

function DefaultItemComponent<T extends Nameable>({
  item,
  className,
  onClick,
  icon,
}: {
  item: T;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  icon?: IconName | ReactNode;
}) {
  return h(MenuItem, {
    icon: item.icon ?? icon,
    text: item.name,
    className,
    onClick,
  });
}

function singularReferent(label: string) {
  let n = "";
  for (let v of ["a", "e", "i", "o", "u"]) {
    if (label.startsWith(v)) {
      n = "n";
      break;
    }
  }
  return `a${n} ${label}`;
}
