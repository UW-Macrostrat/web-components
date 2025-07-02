import h from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";
import { SearchBar } from "../stories/search-bar.stories";
import { TagInput, Spinner } from "@blueprintjs/core";
import { useAPIResult } from "../dist/esm";
import { useMemo, useState } from "react";
import {
  MultiSelect,
  ItemRenderer,
  ItemPredicate,
} from "@blueprintjs/select";
import {
  MenuItem,
  Tag,
} from "@blueprintjs/core";

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
    id_key: string;
    limit: number;
    ascending?: boolean;
    filterable?: boolean;
}

export function PostgRESTInfiniteScrollView(props: PostgRESTInfiniteScrollProps) {
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
        ...rest 
    } = props;

    if (!id_key) {
        throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
    }

    const res = useAPIResult(route, { limit: 1 });
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [filterValue, setFilterValue] = useState<string>("");
    const operator1 = ascending ? `asc` : `desc`;
    const operator2 = ascending ? `gt` : `lt`;

    const defaultParams = useMemo(() => {
        return  {
            [id_key]: operator2 + `.${initialItems?.[0]?.[id_key] ?? (ascending ? 0 : Number.MAX_SAFE_INTEGER)}`,
            order: `${id_key}.${operator1}`,
            limit,
            ...Object.fromEntries(
                selectedItems.map(key => [key, `ilike.*${filterValue}*`])
            ),
        };
    },[id_key, initialItems, ascending, limit, selectedItems, filterValue]);

    if(!res) {
        return h(Spinner)
    }

    const keys = Object.keys(res[0] || {}).filter(key => key !== id_key);

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
    }

    // Function to render each item in dropdown
    const itemRenderer: ItemRenderer<string> = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) return null;
        return h(MenuItem, {
            key: item,
            text: item,
            active: modifiers.active,
            onClick: handleClick,
            shouldDismissPopover: false,
        });
    };

    return h('div.postgrest-infinite-scroll', [
        h.if(filterable)('div.search-bar', [
            h(SearchBar, {
                onChange: (value) => setFilterValue(value  || ""),
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
            })
        ]),
        h(InfiniteScrollView, { 
            ...rest, 
            route,
            getNextParams: getNextParams ?? defaultGetNextParams, 
            params: params ?? defaultParams, 
            initialItems, 
            hasMore: hasMore ?? defaultHasMore 
        })
    ])
}