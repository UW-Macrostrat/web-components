import { Button, MenuItem, MenuItemProps } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, Select2 } from "@blueprintjs/select";
import { Cell, EditableCell2Props } from "@blueprintjs/table";
import React, { useMemo, memo } from "react";
import { useInDarkMode } from "@macrostrat/ui-components";
import { getColorPair } from "@macrostrat/color-utils";
import { useAPIResult } from "@macrostrat/ui-components";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import h from "@macrostrat/hyper";

export interface LexItem {
  id: number;
  name: string;
  color: string;
}

interface LexSelectionProps extends MenuItemProps {
  item: LexItem;
  handleClick: (e: React.MouseEvent<HTMLElement>) => void;
  handleFocus: (e: React.FocusEvent<HTMLElement>) => void;
  modifiers: {
    active: boolean;
    disabled: boolean;
  };
}

function LexOption({
  item,
  handleClick,
  handleFocus,
  modifiers,
  ...restProps
}: LexSelectionProps) {
  const inDarkMode = useInDarkMode();
  const colors = getColorPair(item?.color, inDarkMode);

  if (item == null) {
    return h(
      MenuItem,
      {
        shouldDismissPopover: true,
        active: modifiers.active,
        disabled: modifiers.disabled,
        key: "",
        label: "",
        onClick: handleClick,
        onFocus: handleFocus,
        text: "",
        roleStructure: "listoption",
        ...restProps,
      },
      [],
    );
  }

  return h(
    MenuItem,
    {
      style: colors,
      shouldDismissPopover: true,
      active: modifiers.active,
      disabled: modifiers.disabled,
      key: item.id,
      label: item.id.toString(),
      onClick: handleClick,
      onFocus: handleFocus,
      text: item.name,
      roleStructure: "listoption",
      ...restProps,
    },
    [],
  );
}

const LexOptionMemo = memo(LexOption);

const lexOptionRenderer: ItemRenderer<LexItem> = (
  item: LexItem,
  props: any,
) => {
  return h(LexOptionMemo, {
    key: item.id,
    item,
    ...props,
  });
};

const filterInterval: ItemPredicate<LexItem> = (query, item) => {
  if (item?.name == undefined) {
    return false;
  }
  return item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};

export const LexSelection = ({
  value,
  onConfirm,
  intent,
  items = [],
  placeholder = "Select an item",
  ...props
}) => {
  const [active, setActive] = React.useState(false);

  const item = useMemo(() => {
    if (items == null) {
      return null;
    }
    let item = null;
    if (items.length != 0) {
      item = items.filter(
        (item) => item.id == parseInt(value),
      )[0];
    }

    return item;
  }, [value, items, intent]);

  if (items == null) {
    return null;
  }

  return h(
    Cell,
    {
      ...props,
      style: { ...props.style, padding: 0 },
    },
    [
      h(
        Select2<LexItem>,
        {
          fill: true,
          items: active ? items : [],
          className: "update-input-group",
          popoverProps: {
            position: "bottom",
            minimal: true,
          },
          popoverContentProps: {
            onWheelCapture: (event) => event.stopPropagation(),
          },
          itemPredicate: filterInterval,
          itemRenderer: lexOptionRenderer,
          onItemSelect: (item: LexItem, e) => {
            onConfirm(item.id.toString());
          },
          noResults: h(MenuItem, {
            disabled: true,
            text: "No results.",
            roleStructure: "listoption",
          }),
        },
        h(LexButton, { item, intent, setActive, placeholder }),
      ),
    ],
  );
};

function LexButton({ item, intent, setActive, placeholder }) {
  const inDarkMode = useInDarkMode();
  const colors = getColorPair(item?.color, inDarkMode);
  return h(
    Button,
    {
      style: {
        ...colors,
        fontSize: "12px",
        minHeight: "0px",
        padding: intent ? "0px 10px" : "1.7px 10px",
        boxShadow: "none",
        border: intent ? "2px solid green" : "none",
      },
      fill: true,
      alignText: "left",
      text: h(
        "span",
        { style: { overflow: "hidden", textOverflow: "ellipses" } },
        item?.name ?? placeholder,
      ),
      rightIcon: "double-caret-vertical",
      className: "update-input-group",
      onClick: () => setActive(true),
    },
    [],
  );
}