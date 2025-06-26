import hyper from "@macrostrat/hyper";
import { IconName, MenuItem, Spinner, Button, Intent } from "@blueprintjs/core";
import { ComponentType, MouseEventHandler, ReactNode } from "react";
import { Select } from "@blueprintjs/select";
import styles from "./index.module.sass";
import classNames from "classnames";

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
  fill = true,
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
  fill?: boolean;
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
          return h(itemComponent, {
            key: item.name,
            item,
            onClick: handleClick,
            icon,
            selected: selectedItem == item,
          });
        },
        onItemSelect: onSelectItem,
        popoverProps: {
          minimal,
          usePortal,
          matchTargetWidth: fill,
        },
        filterable,
        fill,
      },
      h(
        "div.target-container",
        {
          className: classNames({ "fill-width": fill }),
        },
        [
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
        ],
      ),
    ),
  );
}

interface Nameable {
  name: string;
  icon?: IconName | ReactNode;
  intent?: Intent;
}

interface ItemComponentProps<T> {
  item: T;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  icon?: IconName | ReactNode;
  selected?: boolean;
  intent?: Intent;
}

function DefaultItemComponent<T extends Nameable>({
  item,
  className,
  onClick,
  icon,
  selected,
  intent,
}: ItemComponentProps<T>) {
  return h(MenuItem, {
    icon: item.icon ?? icon,
    text: item.name,
    intent: item.intent ?? intent,
    className: classNames({ selected }),
    active: selected,
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
