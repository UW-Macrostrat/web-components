import h from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
    id_key: string;
    limit: number;
    ascending?: boolean;
    filter_key?: string;
    filter_value?: string;
    order_key?: string;
}

export function PostgRESTInfiniteScrollView(props: PostgRESTInfiniteScrollProps) {
    let { 
        id_key, 
        ascending = true, 
        limit, 
        filter_key, 
        filter_value, 
        initialItems, 
        order_key, 
        getNextParams,
        hasMore,
        params,
        ...rest 
    } = props;

    const operator1 = ascending ? `asc` : `desc`;
    const operator2 = ascending ? `gt` : `lt`;

    if (!id_key) {
        throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
    }

    if (filter_key && filter_value?.length > 0 ) {
        initialItems = initialItems?.filter(item => item[filter_key]?.includes(filter_value));
    }

    let defaultParams = {
        [id_key]: operator2 + `.${initialItems?.[0]?.[id_key] ?? (ascending ? 0 : Number.MAX_SAFE_INTEGER)}`,
        order: `${id_key}.${operator1}`,
        limit,
    }

    if (filter_key) {
        defaultParams[filter_key] = `ilike.*${filter_value}*`;
    }

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


    return h(InfiniteScrollView, { 
        ...rest, 
        getNextParams: getNextParams ?? defaultGetNextParams, 
        params: params ?? defaultParams, 
        initialItems, 
        hasMore: hasMore ?? defaultHasMore 
    });
}