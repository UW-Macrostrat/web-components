import hyper from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";
import { useAPIResult } from "./api";
import { useMemo, useState } from "react";
import { MultiSelect, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { MenuItem, Spinner, InputGroup } from "@blueprintjs/core";
import styles from "./postgrest.module.sass";

const h = hyper.styled(styles);

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
  id_key: string;
  limit: number;
  extraParams?: Record<string, any>;
  ascending?: boolean;
  filterable?: boolean;
  searchColumns?: string[];
  order_key?: string;
  key?: string;
  toggles?: any;
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
    order_key = undefined,
    SearchBarComponent,
    MultiSelectComponent,
    extraParams = {},
    key,
    toggles = null,
    searchColumns = undefined,
    ...rest
  } = props;

  if (!id_key) {
    throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
  }

  const [selectedItems, setSelectedItems] = useState<string[]>(searchColumns || []);
  const [filterValue, setFilterValue] = useState<string>("");

  const SearchBarToUse = SearchBarComponent ?? SearchBar;
  const MultiSelectToUse = MultiSelectComponent ?? MultiSelect;

<<<<<<< HEAD
  const orderOperator = ascending ? `asc` : `desc`;
  const notOrderOperator1 = ascending ? `desc` : `asc`;
  const compOperator = ascending ? `gt` : `lt`;
  const notCompOperator2 = ascending ? `lt` : `gt`;

  const res = useAPIResult(route, { 
    limit: 1,
    order: [id_key] + '.desc'
  });

  const maxId = res?.[0][id_key]
    ? res[0][id_key]
    : ascending
      ? 0
      : 2 ** 28;

=======
  const res = useAPIResult(route, { limit: 1 });
  const [selectedItems, setSelectedItems] = useState<string[]>(
    searchColumns || [],
  );
  const [filterValue, setFilterValue] = useState<string>("");
  const operator1 = ascending ? `asc` : `desc`;
  const notOperator1 = ascending ? `desc` : `asc`;
  const operator2 = ascending ? `gt` : `lt`;
  const notOperator2 = ascending ? `lt` : `gt`;
>>>>>>> cbeb803c45afa609f8dcaa75bbdde83b2d0694f3
  const id = ascending ? 0 : maxId;
  const notId = ascending ? maxId : 0;
  const newInitialItems =
    selectedItems.length === 0 && filterValue === "" ? initialItems : undefined;

  const orParam = `(${order_key}.${compOperator}.${id},and(${order_key}.eq.${id},${id_key}.${notCompOperator2}.${notId}))`;

  const specialCase = order_key && selectedItems?.length > 0;

  const searchItemsParam =
    "(" +
    selectedItems.map((key) => `${key}.ilike.*${filterValue}*`).join(",") +
    ")";

  const defaultParams = useMemo(() => {
    return {
      ...extraParams,
      [id_key]: !order_key
        ? compOperator + `.${newInitialItems?.[0]?.[id_key] ?? id}`
        : undefined,
      order: order_key
        ? `${order_key}.${orderOperator},${id_key}.${notOrderOperator1}`
        : `${id_key}.${orderOperator}`,
      limit,
      or: order_key
        ? selectedItems.length == 0
          ? orParam
          : undefined
        : selectedItems.length > 0
          ? searchItemsParam
          : null,
      and: specialCase ? `(or${orParam},or${searchItemsParam})` : undefined,
    };
  }, [
    selectedItems,
    filterValue,
    orParam,
    searchItemsParam,
    newInitialItems,
    id_key,
    order_key,
    limit,
    orderOperator,
    notOrderOperator1,
    compOperator,
    notCompOperator2,
  ]);

  if (!res) {
    return h(Spinner);
  }

  const keys =
    searchColumns ||
    Object.keys(res[0] || {}).filter((key) => typeof res[0][key] === "string");

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
    const lastItem = response?.[response.length - 1];
    if (
      !lastItem ||
      lastItem[id_key] === undefined ||
      lastItem[id_key] === null
    ) {
      return params;
    }

    if (!order_key) {
      // Simple cursor on id_key only
      return {
        ...params,
        [id_key]: `${compOperator}.${lastItem[id_key]}`,
      };
    } else {
      const lastOrderValue = lastItem[order_key];
      const lastIdValue = lastItem[id_key];

      if (
        lastOrderValue === undefined ||
        lastOrderValue === null ||
        lastIdValue === undefined ||
        lastIdValue === null
      ) {
        return params;
      }

      // Compound cursor with order_key and id_key
      const newOr = `(${order_key}.${compOperator}.${lastOrderValue},and(${order_key}.eq.${lastOrderValue},${id_key}.${notCompOperator2}.${lastIdValue}))`;

      return {
        ...params,
        or: newOr,
      };
    }
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

  const {
    toggles: _omitToggles,
    SearchBarComponent: _omitSearchBar,
    MultiSelectComponent: _omitMultiSelect,
    ...cleaned
  } = props;

  const newKey =
    key ||
    `${filterValue}-${selectedItems.join(",")}-${JSON.stringify(cleaned)}`;

  return h("div.postgrest-infinite-scroll", [
    h("div.header", [
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
      h.if(toggles)("div.toggles", toggles),
    ]),
    h(InfiniteScrollView, {
      ...rest,
      route,
      getNextParams: getNextParams ?? defaultGetNextParams,
      params: params ?? defaultParams,
      initialItems: newInitialItems,
      hasMore: hasMore ?? defaultHasMore,
      key: newKey,
    }),
  ]);
}

function SearchBar({ onChange, placeholder = "Search..." }) {
  return h(InputGroup, {
    className: "search-bar",
    size: "large",
    fill: true,
    round: false,
    placeholder,
    onChange: (e) => {
      const value = e.target.value;
      onChange(value);
    },
    leftIcon: "search",
  });
}
