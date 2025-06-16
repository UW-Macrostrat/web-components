// @ts-nocheck
import h from "@macrostrat/hyper";
import update, { Spec } from "immutability-helper";
import React, { useReducer, useEffect, useRef, useCallback, memo } from "react";
import { Spinner, NonIdealState } from "@blueprintjs/core";
import { APIParams, QueryParams } from "./util/query-string";
import { useInView } from "react-intersection-observer";

import { APIResultProps, useAPIActions } from "./api";
import { JSONView } from "./util/json-view";
import { IndexingProvider } from "./api/indexing";

interface ScrollState<T = object> {
  items: T[];
  scrollParams: APIParams;
  count: number | null;
  error?: any;
  hasMore: boolean;
  isLoadingPage: number | null;
  pageIndex: number;
}

type ScrollResponseItems<T> = Pick<
  ScrollState<T>,
  "count" | "hasMore" | "items"
>;

interface InfiniteScrollProps<T> extends Omit<APIResultProps<T>, "params"> {
  getCount(r: T): number;
  getNextParams(r: T, params: QueryParams): QueryParams;
  getItems(r: T): any;
  hasMore(res: T): boolean;
  totalCount?: number;
  // Only allow more restrictive parameter types
  params: APIParams;
  className?: string;
  itemComponent?: React.ComponentType<{ data: T; index: number }>;
  loadingPlaceholder?: React.ComponentType;
  emptyPlaceholder?: React.ComponentType;
  finishedPlaceholder?: React.ComponentType;
  resultsComponent?: React.ComponentType<{ data: T[] }>;
  perPage?: number;
  startPage?: number;
}

type UpdateState<T> = { type: "update-state"; spec: Spec<ScrollState<T>> };
type LoadNextPage = {
  type: "load-next-page";
  page: number;
};
type LoadPage<T> = {
  type: "load-page";
  params: APIParams;
  dispatch: Dispatch<T>;
  callback<T>(action: LoadPage<T>): void;
};

type ScrollAction<T> = UpdateState<T> | LoadNextPage | LoadPage<T>;

type Reducer<T> = (
  state: ScrollState<T>,
  action: ScrollAction<T>
) => ScrollState<T>;
type Dispatch<T> = (action: ScrollAction<T>) => void;

function infiniteScrollReducer<T>(
  state: ScrollState<T>,
  action: ScrollAction<T>
) {
  switch (action.type) {
    case "update-state":
      return update(state, action.spec);
    case "load-page":
      action.callback(action);
      return update(state, {
        // @ts-ignore
        isLoadingPage: { $set: action.params.page ?? 0 },
      });
  }
}

export function InfiniteScroll(props) {
  const {
    hasMore,
    children,
    className,
    loadMore,
    offset = 0,
    isLoading,
  } = props;
  const { ref, inView } = useInView({
    rootMargin: `0px 0px ${offset}px 0px`,
    trackVisibility: true,
    delay: 100,
  });

  const shouldLoadMore = hasMore && inView;

  useEffect(() => {
    if (shouldLoadMore) loadMore();
  }, [shouldLoadMore, isLoading]);

  return h("div.infinite-scroll-container", { className }, [
    children,
    //h.if(state.isLoadingPage != null)(placeholder),
    h("div.bottom-marker", { ref }),
  ]);
}

const Placeholder = (props) => {
  const {
    loading,
    title = "No results yet",
    description = null,
    ...rest
  } = props;

  return h("div.placeholder", [
    h(NonIdealState, {
      icon: "search-template",
      className: "placeholder-inner",
      title,
      description,
      ...rest,
    }),
  ]);
};

export const LoadingPlaceholder = (props: {
  itemName?: string;
  scrollParams?: APIParams;
  pageIndex?: number | null;
  loadedCount?: number;
  totalCount?: number;
  perPage?: number;
}) => {
  const { perPage = 10, loadedCount = 0, itemName = "results" } = props;
  const { totalCount = 0 } = props;

  let description = null;
  if (totalCount != null) {
    const loadedPages = Math.ceil(loadedCount / perPage);
    const totalPages = Math.ceil(totalCount / perPage);
    description = `Page ${loadedPages} of ${totalPages}`;
  }

  return h(Placeholder, {
    icon: h(Spinner),
    title: "Loading " + itemName,
    description,
  });
};

function EmptyPlaceholder() {
  return h(Placeholder, {
    icon: "inbox",
    title: "No results",
  });
}

function FinishedPlaceholder({ totalCount, ...rest }: { totalCount?: number }) {
  const description = totalCount != null ? `${totalCount} total items` : null;
  return h(Placeholder, {
    icon: null,
    title: "No more results",
    description,
    ...rest,
  });
}

function InfiniteScrollView<T>(props: InfiniteScrollProps<T>) {
  /*
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  */
  const {
    route,
    params,
    opts,
    placeholder,
    className,
    itemComponent = JSONView,
    loadingPlaceholder = LoadingPlaceholder,
    emptyPlaceholder = EmptyPlaceholder,
    finishedPlaceholder = FinishedPlaceholder,
    resultsComponent = "div.results",
    perPage = 10,
    startPage = 0,
  } = props;
  const { get } = useAPIActions();
  const { getCount, getNextParams, getItems, hasMore } = props;

  const initialState: ScrollState<T> = {
    items: [],
    scrollParams: params,
    count: null,
    error: null,
    hasMore: true,
    isLoadingPage: null,
    pageIndex: startPage,
  };

  const pageOffset = 0;

  const [state, dispatch] = useReducer<Reducer<T>>(
    infiniteScrollReducer,
    initialState
  );

  const loadPage = useCallback(
    async (action: LoadPage<T>) => {
      const res = await get(route, action.params, opts);
      console.log("Loaded page with params", action.params);
      const itemVals = getItems(res);
      const ival = { $push: itemVals };
      const nextLength = state.items.length + itemVals.length;
      const count = getCount(res);
      console.log(state.items);
      // if (state.isLoadingPage == null) {
      //   // We have externally cancelled this request (by e.g. moving to a new results set)
      //   console.log("Loading cancelled")
      //   return
      // }

      let p1: QueryParams = getNextParams(res, params);
      let hasNextParams = p1 != null;
      console.log("Next page parameters", p1);

      action.dispatch({
        type: "update-state",
        spec: {
          items: ival,
          // @ts-ignore
          scrollParams: { $set: p1 },
          pageIndex: { $set: state.pageIndex + 1 },
          count: { $set: count },
          hasMore: {
            $set: hasMore(res) && itemVals.length > 0 && hasNextParams,
          },
          isLoadingPage: { $set: null },
        },
      });
    },
    [state.items, route, params, opts]
  );

  const loadMore = useCallback(() => {
    dispatch({
      type: "load-page",
      params: state.scrollParams,
      dispatch,
      // @ts-ignore
      callback: loadPage,
    });
  }, [state.scrollParams, loadPage, route, params, opts]);

  const isInitialRender = useRef(true);
  const loadInitialData = useCallback(
    function () {
      // Don't run on initial render
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
      console.log("Resetting to initial data");
      /*
    Get the initial dataset
    */
      // const success = await get(route, params, opts);
      // parseResponse(success, true)
      //if (state.items.length == 0 && state.isLoadingPage == null) return
      dispatch({ type: "update-state", spec: { $set: initialState } });
      //await loadNext(0)
    },
    [isInitialRender, route, params, opts]
  );

  useEffect(loadInitialData, [props.route, props.params]);

  if (state == null) return null;

  //useAsyncEffect(getInitialData, [route, params]);

  //const showLoader = state.isLoadingPage != null && state.items.length > 0

  const data = state.items;
  const isLoading = state.isLoadingPage != null;
  const isEmpty = data.length == 0 && !isLoading;
  const isFinished = !state.hasMore && !isLoading;
  const totalCount = props.totalCount ?? state.count;

  return h(
    InfiniteScroll,
    {
      pageStart: -1,
      loadMore,
      hasMore: state.hasMore && state.isLoadingPage == null,
      loader: placeholder,
      useWindow: true,
      className,
    },
    [
      h.if(isEmpty)(emptyPlaceholder),
      h.if(!isEmpty)(IndexingProvider, { totalCount, indexOffset: 0 }, [
        h(
          resultsComponent,
          { data },
          data.map((d, i) => {
            return h(itemComponent, { key: i, data: d, index: i });
          })
        ),
        // @ts-ignore
        h.if(isLoading)(loadingPlaceholder, {
          totalCount,
          scrollParams: state.scrollParams,
          pageIndex: state.pageIndex,
          loadedCount: data.length,
          perPage,
        }),
        // @ts-ignore
        h.if(isFinished)(finishedPlaceholder, { totalCount }),
      ]),
    ]
  );
}

InfiniteScrollView.defaultProps = {
  hasMore(res) {
    return true;
  },
  getItems(d) {
    return d;
  },
  getCount(d) {
    return null;
  },
  getNextParams(response, params) {
    const lastPage = params.page ?? 0;
    return { ...params, page: lastPage + 1 };
  },
  placeholder: (p: APIPlaceholderProps) => h(Spinner),
};

export { InfiniteScrollView };
