import h from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
    id_key: string;
    limit: number;
    ascending?: boolean;
    filter_key?: string;
    filter_value?: string;
}

export function PostgRESTInfiniteScrollView(props: PostgRESTInfiniteScrollProps) {
    let { id_key, ascending = true, limit, filter_key, filter_value, initialItems, ...rest } = props;

    if (!id_key) {
        throw new Error("PostgRESTInfiniteScrollView requires an id_key prop");
    }

    if (filter_key && filter_value?.length > 0 ) {
        initialItems = initialItems?.filter(item => item[filter_key]?.includes(filter_value));
    }

    let params = {
        [id_key]: (ascending ? `gt` : `lt`) + `.${props.initialItems?.[0]?.[id_key] ?? ""}`,
        order: ascending ? `${id_key}.asc` : `${id_key}.desc`,
        limit,
    }

    if (filter_key) {
        params[filter_key] = `ilike.*${filter_value}*`;
    }

    const getNextParams = (response, params) => {
        const lastItem = response[response.length - 1];

        return {
            ...params,
            [id_key]: (ascending ? `gt` : `lt`) + `.${lastItem[id_key]}`,
        };
    };


    return h(InfiniteScrollView, { ...rest, getNextParams, params, initialItems });
}