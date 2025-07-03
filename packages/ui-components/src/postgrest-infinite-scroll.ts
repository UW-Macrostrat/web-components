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
    ...rest
  } = props;

  if (!id_key) {
    throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
  }

  const maxId = 2 ** 28; // max allowed with postgREST

  const res = useAPIResult(route, { limit: 1 });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterValue, setFilterValue] = useState<string>("");
  const operator1 = ascending ? `asc` : `desc`;
  const notOperator1 = ascending ? `desc` : `asc`;
  const operator2 = ascending ? `gt` : `lt`;
  const notOperator2 = ascending ? `lt` : `gt`;
  const id = ascending ? 0 : maxId;
  const notId = ascending ? maxId : 0;

  const or = `(${order_key}.${operator2}.${id},and(${order_key}.eq.${id},${id_key}.${notOperator2}.${notId}))`;

  const defaultParams = useMemo(() => {
    return {
      [id_key]: !order_key ?
        operator2 + `.${initialItems?.[0]?.[id_key] ?? id}` : undefined,
      order: order_key ? 
        `${order_key}.${operator1},${id_key}.${notOperator1}` : `${id_key}.${operator1}`,
      limit,
      ...Object.fromEntries(
        selectedItems.map((key) => [key, `ilike.*${filterValue}*`]),
      ),
      or: order_key ? 
        or : undefined,
    };
  }, [selectedItems, filterValue]);

  console.log("defaultParams", defaultParams);

  if (!res) {
    return h(Spinner);
  }

  const keys = Object.keys(res[0] || {}).filter((key) => key !== id_key);

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

    return {
      ...params,
      [id_key]: operator2 + `.${lastItem[id_key]}`,
    };
  };

  const defaultHasMore = (response) => {
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
      h(SearchBar, {
        onChange: (value) => setFilterValue(value || ""),
      }),
      h(MultiSelect, {
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