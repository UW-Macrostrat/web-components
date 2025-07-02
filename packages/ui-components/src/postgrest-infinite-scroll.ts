import h from "@macrostrat/hyper";
import { InfiniteScrollProps, InfiniteScrollView } from "./infinite-scroll";

interface PostgRESTInfiniteScrollProps extends InfiniteScrollProps<any> {
    id_key: string;
    limit: number;
    ascending?: boolean;
}

export function PostgRESTInfiniteScrollView(props: PostgRESTInfiniteScrollProps) {
    const { id_key, ascending = true, limit, ...rest } = props;

    const params = {
        [id_key]: (ascending ? `gt` : `lt`) + `.${props.initialItems?.[0]?.[id_key] ?? ""}`,
        order: ascending ? `${id_key}.asc` : `${id_key}.desc`,
        limit,
    }

    const getNextParams = (response, params) => {
        const lastItem = response[response.length - 1];

        return {
            ...params,
            [id_key]: (ascending ? `gt` : `lt`) + `.${lastItem[id_key]}`,
        };
    };


    return h(InfiniteScrollView, { ...rest, getNextParams, params });
}