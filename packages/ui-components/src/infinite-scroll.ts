// @ts-nocheck
import h from "@macrostrat/hyper";
import update, { Spec } from "immutability-helper";
import React, { useReducer, useEffect, useRef, useCallback } from "react";
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

type UpdateState<T> = { type: "update-state"; spec: Spec<ScrollState<T>> };
type LoadPage<T> = {
  type: "load-page";
  params: APIParams;
  dispatch: Dispatch<T>;
  callback<T>(action: LoadPage<T>): void;
};

type ScrollAction<T> = UpdateState<T> | LoadPage<T>;
type Reducer<T> = (
  state: ScrollState<T>,
  action: ScrollAction<T>,
) => ScrollState<T>;
type Dispatch<T> = (action: ScrollAction<T>) => void;

function infiniteScrollReducer<T>(
  state: ScrollState<T>,
  action: ScrollAction<T>,
) {
  switch (action.type) {
    case "update-state":
      return update(state, action.spec);
    case "load-page":
      action.callback(action);
      return update(state, {
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
    delay = 100,
  } = props;
  const { ref, inView } = useInView({
    rootMargin: `0px 0px ${offset}px 0px`,
    trackVisibility: true,
    delay: delay >= 100 ? delay : 100,
  });

  // Only load more if not currently loading
  const shouldLoadMore = hasMore && inView && !isLoading;

  useEffect(() => {
    if (shouldLoadMore) {
      loadMore();
    }
  }, [shouldLoadMore, loadMore]);

  return h("div.infinite-scroll-container", { className }, [
    children,
    h("div.bottom-marker", { ref, style: { padding: "1px" } }),
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
  const {
    route,
    params,
    opts,
    placeholder = (p: APIPlaceholderProps) => h(Spinner),
    className,
    itemComponent = JSONView,
    loadingPlaceholder = LoadingPlaceholder,
    emptyPlaceholder = EmptyPlaceholder,
    finishedPlaceholder = FinishedPlaceholder,
    resultsComponent = "div.results",
    perPage = 10,
    startPage = 0,
    initialItems = [],
    delay,
  } = props;
  const { get } = useAPIActions();
  const {
    getCount = () => null,
    getNextParams = (response, params) => {
      const lastPage = params.page ?? 0;
      return { ...params, page: lastPage + 1 };
    },
    getItems = (d) => d,
    hasMore = (d) => true,
  } = props;

  const initialState: ScrollState<T> = {
    items: initialItems,
    scrollParams: params,
    count: null,
    error: null,
    hasMore: true,
    isLoadingPage: null,
    pageIndex: startPage,
  };

  const [state, dispatch] = useReducer<Reducer<T>>(
    infiniteScrollReducer,
    initialState,
  );

  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (action: LoadPage<T>) => {
      if (loadingRef.current) return; // Prevent concurrent loads
      loadingRef.current = true;

      dispatch(action);

      try {
        const res = await get(route, action.params, opts);

        const itemVals = getItems(res);
        const nextParams = getNextParams(res, action.params);
        const count = getCount(res);
        const more = hasMore(res) && itemVals.length > 0 && nextParams != null;

        action.dispatch({
          type: "update-state",
          spec: {
            items: { $push: itemVals },
            scrollParams: { $set: nextParams },
            pageIndex: { $set: state.pageIndex + 1 },
            count: { $set: count },
            hasMore: { $set: more },
            isLoadingPage: { $set: null },
            error: { $set: null },
          },
        });
      } catch (error) {
        console.error("Error loading page:", error);
        action.dispatch({
          type: "update-state",
          spec: { error: { $set: error }, isLoadingPage: { $set: null } },
        });
      } finally {
        loadingRef.current = false;
      }
    },
    [
      get,
      route,
      opts,
      getItems,
      getNextParams,
      getCount,
      hasMore,
      state.pageIndex,
    ],
  );

  const loadMore = useCallback(() => {
    if (state.isLoadingPage !== null || !state.hasMore) return;
    dispatch({
      type: "load-page",
      params: state.scrollParams,
      dispatch,
      callback: loadPage,
    });
  }, [state.isLoadingPage, state.hasMore, state.scrollParams, loadPage]);

  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      if (state.items.length === 0) {
        loadMore();
      }
    }
  }, [loadMore, state.items.length]);

  if (state == null) return null;

  const data = state.items;
  const isLoading = state.isLoadingPage != null;
  const isEmpty = data.length === 0 && !isLoading;
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
      delay,
      isLoading,
    },
    [
      h.if(isEmpty)(emptyPlaceholder),
      h.if(!isEmpty)(IndexingProvider, { totalCount, indexOffset: 0 }, [
        h(
          resultsComponent,
          { data },
          data.map((d, i) => h(itemComponent, { key: i, data: d, index: i })),
        ),
        h.if(isLoading)(loadingPlaceholder, {
          totalCount,
          scrollParams: state.scrollParams,
          pageIndex: state.pageIndex,
          loadedCount: data.length,
          perPage,
        }),
        h.if(isFinished)(finishedPlaceholder, { totalCount }),
      ]),
    ],
  );
}

export { InfiniteScrollView };
