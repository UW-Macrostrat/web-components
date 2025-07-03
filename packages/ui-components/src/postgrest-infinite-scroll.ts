import h from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";
import { SearchBar } from "../stories/search-bar.stories";
import { useAPIResult } from "@macrostrat/ui-components";
import { useMemo, useState } from "react";
import { MultiSelect, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { MenuItem, Spinner } from "@blueprintjs/core";

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
  id_key: string;
  limit: number;
  ascending?: boolean;
  filterable?: boolean;
  order_key?: string;
  SearchBarComponent?: React.ComponentType<{
    onChange: (value: string) => void;
  }>;
  MultiSelectComponent?: React.ComponentType<{
    items: string[];
    itemRenderer: ItemRenderer<string>;
    itemPredicate: ItemPredicate<string>;
    selectedItems: string[];
    onItemSelect: (item: string) => void;
    tagRenderer: (item: string) => React.ReactNode;
    onRemove: (tag: React.ReactNode, index: number) => void;
    tagInputProps: any;
    popoverProps: any;
  }>;
}

export function PostgRESTInfiniteScrollView(
  props: PostgRESTInfiniteScrollProps,
) {
  let {
    id_key,
    ascending = true,
    filterable = false,
    limit,
    initialItems,
    getNextParams,
    hasMore,
    params,
    route,
    order_key,
    SearchBarComponent,
    MultiSelectComponent,
    ...rest
  } = props;

  if (!id_key) {
    throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
  }

  const maxId = 2 ** 28; // max allowed with postgREST
  const SearchBarToUse = SearchBarComponent ?? SearchBar;
  const MultiSelectToUse = MultiSelectComponent ?? MultiSelect;

  const res = useAPIResult(route, { limit: 1 });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterValue, setFilterValue] = useState<string>("");
  const operator1 = ascending ? `asc` : `desc`;
  const notOperator1 = ascending ? `desc` : `asc`;
  const operator2 = ascending ? `gt` : `lt`;
  const notOperator2 = ascending ? `lt` : `gt`;
  const id = ascending ? 0 : maxId;
  const notId = ascending ? maxId : 0;

  const orParam = `(${order_key}.${operator2}.${id},and(${order_key}.eq.${id},${id_key}.${notOperator2}.${notId}))`;

  console.log('selectedItems', selectedItems);

  const searchItemsParam = "(" + 
    selectedItems.map((key) => `${key}.ilike.*${filterValue}*`).join(',')
  + ")";

  const defaultParams = useMemo(() => {
    return {
      [id_key]: !order_key
        ? operator2 + `.${initialItems?.[0]?.[id_key] ?? id}`
        : undefined,
      order: order_key
        ? `${order_key}.${operator1},${id_key}.${notOperator1}`
        : `${id_key}.${operator1}`,
      limit,
      or: order_key
        ? selectedItems?.length > 0
          ? orParam + "&or=" + searchItemsParam
          : orParam
        : selectedItems?.length > 0
          ? searchItemsParam
          : undefined,
    };
  }, [selectedItems, filterValue, orParam, searchItemsParam, initialItems, id_key, order_key, limit, operator1, notOperator1, operator2, notOperator2]);

  console.log("defaultParams", defaultParams.or);

  if (!res) {
    return h(Spinner);
  }

  const keys = Object.keys(res[0] || {}).filter((key) => typeof res[0][key] === "string");

  // Filtering function
  const filterItem: ItemPredicate<string> = (query, item) =>
    item.toLowerCase().includes(query.toLowerCase());

  const handleSelect = (item: string) => {
    if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRemove = (_: React.ReactNode, index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const defaultGetNextParams = (response, params) => {
    const lastItem = response[response.length - 1];
    if (!lastItem || !lastItem[id_key]) {
      return params;
    }

    if (!order_key) {
      // simple cursor on id_key only
      return {
        ...params,
        [id_key]: operator2 + `.${lastItem[id_key]}`,
      };
    } else {
      // compound cursor with order_key and id_key for pagination
      const lastOrderValue = lastItem[order_key];
      const lastIdValue = lastItem[id_key];

      const newOr = `(${order_key}.${operator2}.${lastOrderValue},and(${order_key}.eq.${lastOrderValue},${id_key}.${notOperator2}.${lastIdValue}))`;

      return {
        ...params,
        or: newOr,
      };
    }
  };

  const defaultHasMore = (response) => {
    console.log("defaultHasMore", response);
    return response.length === limit;
  };

  // Function to render each item in dropdown
  const itemRenderer: ItemRenderer<string> = (
    item,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) return null;
    return h(MenuItem, {
      key: item,
      text: item,
      active: modifiers.active,
      onClick: handleClick,
      shouldDismissPopover: false,
    });
  };

  return h("div.postgrest-infinite-scroll", [
    h.if(filterable)("div.search-bar", [
      h(SearchBarToUse, {
        onChange: (value) => setFilterValue(value || ""),
      }),
      h(MultiSelectToUse, {
        items: keys.filter((item) => !selectedItems.includes(item)),
        itemRenderer,
        itemPredicate: filterItem,
        selectedItems,
        onItemSelect: handleSelect,
        tagRenderer: (item) => item,
        onRemove: handleRemove,
        tagInputProps: {
          onRemove: handleRemove,
          placeholder: "Select a column(s) to filter by...",
        },
        popoverProps: { minimal: true },
      }),
    ]),
    h(InfiniteScrollView, {
      ...rest,
      route,
      getNextParams: getNextParams ?? defaultGetNextParams,
      params: params ?? defaultParams,
      initialItems,
      hasMore: hasMore ?? defaultHasMore,
      key: filterValue + selectedItems.join(","),
    }),
  ]);
}
