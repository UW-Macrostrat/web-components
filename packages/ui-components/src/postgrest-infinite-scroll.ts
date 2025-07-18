import hyper from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";
import { useAPIResult } from "./api";
import { useMemo, useState } from "react";
import { MultiSelect, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import { MenuItem, Spinner, InputGroup } from "@blueprintjs/core";
import styles from "./postgrest.module.sass";
import { ExpansionPanel } from "@macrostrat/map-interface";

const h = hyper.styled(styles);

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
  id_key: string;
  limit: number;
  extraParams?: Record<string, any>;
  ascending?: boolean;
  filterable?: boolean;
  searchColumns?: Array<{ value: string; label: string }>;
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
  group_key?: string;
  groups?: Array<{ value: string; label: string }>;
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
    group_key = undefined,
    ...rest
  } = props;

  if (!id_key) {
    throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
  }

  const [selectedItems, setSelectedItems] = useState<string[]>(
    (searchColumns ?? []).map((col) => col.value),
  );

  const [filterValue, setFilterValue] = useState<string>("");

  const SearchBarToUse = SearchBarComponent ?? SearchBar;
  const MultiSelectToUse = MultiSelectComponent ?? MultiSelect;

  const orderOperator = ascending ? `asc` : `desc`;
  const notOrderOperator1 = ascending ? `desc` : `asc`;
  const compOperator = ascending ? `gt` : `lt`;
  const notCompOperator2 = ascending ? `lt` : `gt`;

  const res = useAPIResult(route, {
    limit: 1,
    order: [id_key] + ".desc",
  });

  const maxId = res?.[0][id_key] ? res[0][id_key] : ascending ? 0 : 2 ** 28;

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
    searchColumns ??
    (res?.[0]
      ? Object.keys(res[0])
          .filter((key) => typeof res[0][key] === "string")
          .map((key) => ({
            label: key.replace(/_/g, " "),
            value: key,
          }))
      : []);

  // Filtering function
  const filterItem: ItemPredicate<{ label: string; value: string }> = (
    query,
    item,
  ) => item.label.toLowerCase().includes(query.toLowerCase());

  const handleSelect = (item: { label: string; value: string }) => {
    if (!selectedItems.includes(item.value)) {
      setSelectedItems([...selectedItems, item.value]);
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
  const itemRenderer: ItemRenderer<{ label: string; value: string }> = (
    item,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) return null;
    return h(MenuItem, {
      key: item.value,
      text: item.label,
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
        h.if(searchColumns == null || searchColumns.length > 1)(
          MultiSelectToUse,
          {
            items: keys.filter((item) => !selectedItems.includes(item.value)),
            itemRenderer,
            itemPredicate: filterItem,
            selectedItems,
            onItemSelect: handleSelect,
            tagRenderer: (value) => {
              const found = keys.find((k) => k.value === value);
              return found ? found.label : value;
            },
            onRemove: handleRemove,
            tagInputProps: {
              onRemove: handleRemove,
              placeholder: "Select a column(s) to filter by...",
            },
            popoverProps: { minimal: true },
          },
        ),
      ]),
      h.if(toggles)("div.toggles", toggles),
    ]),
    group_key
      ? Grouping({
          group_key,
          groups: props.groups ?? [],
          route,
          id_key,
          params: defaultParams,
          getNextParams: getNextParams ?? defaultGetNextParams,
          hasMore: hasMore ?? defaultHasMore,
          key: newKey,
          rest,
        })
      : h(InfiniteScrollView, {
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

interface GroupingProps {
  group_key: string;
  groups: Array<{ value: string; label: string }>;
  route: string;
  id_key: string;
  params?: Record<string, any>;
  getNextParams?: (
    response: any[],
    params: Record<string, any>,
  ) => Record<string, any>;
  hasMore?: (response: any[]) => boolean;
  key?: string;
  rest?: any;
}

function Grouping(props: GroupingProps) {
  const {
    group_key,
    groups,
    route,
    id_key,
    params,
    getNextParams,
    hasMore,
    rest,
  } = props;

  return h("div.group-page", [
    groups.map((group) => {
      if (!group.value || !group.label) {
        throw new Error("Each group must have a value and label");
      }

      return h(GroupPanel, {
        group,
        route,
        id_key,
        params: {
          ...params,
          [group_key]: "eq." + group.value,
        },
        getNextParams,
        hasMore,
        ...rest,
      });
    }),
  ]);
}

function GroupPanel(props) {
  const { group, route, params, getNextParams, hasMore, key, ...rest } = props;

  const data = useAPIResult(route, {
    ...params,
    limit: 1,
  });

  if (!data || data?.length === 0) return null;

  return h(
    ExpansionPanel,
    {
      title: group.label,
    },
    [
      h(InfiniteScrollView, {
        key: key || group.value,
        route,
        params,
        getNextParams,
        hasMore,
        ...rest,
      }),
    ],
  );
}
