import InfiniteScroll from 'react-infinite-scroller';
import h from 'react-hyperscript';
import update, {Spec} from 'immutability-helper'
import {useReducer, useEffect, useRef, useCallback} from 'react'

import {APIView, APIResultProps, useAPIActions} from "./api";

interface ScrollState<T=object> {
  items: T[],
  scrollParams: QueryParams,
  count: number|null,
  error?: any,
  hasMore: boolean,
  isLoadingPage: number|null
}

type ScrollResponseItems<T> = Pick<ScrollState<T>,'count'|'hasMore'|'items'>

interface InfiniteScrollProps<T> extends APIResultProps<T> {
  getCount(r: T): number,
  getNextParams(r: T, params: QueryParams): QueryParams,
  getItems(r: T): any,
  hasMore(res: T): boolean,
}

type UpdateState<T> = {type: 'update-state', spec: Spec<ScrollState<T>>}
type LoadNextPage = {
  type: 'load-next-page',
  page: number
}
type LoadPage<T> = {
  type: 'load-page',
  params: QueryParams,
  dispatch: Dispatch<T>,
  callback<T>(action: LoadPage<T>): void
}

type ScrollAction<T> =
  | UpdateState<T>
  | LoadNextPage
  | LoadPage<T>

type Reducer<T> = (state: ScrollState<T>, action: ScrollAction<T>)=>ScrollState<T>
type Dispatch<T> = (action: ScrollAction<T>)=> void

const infiniteScrollReducer = function<T>(state: ScrollState<T>, action: ScrollAction<T>) {
  switch (action.type) {
  case "update-state":
    return update(state, action.spec)
  case "load-page":
    action.callback(action)
    return update(state, {isLoadingPage: {$set: action.params.page ?? 0}})
  }
}

const InfiniteScrollView = function<T>(props: InfiniteScrollProps<T>){
  /*
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  */
  const {
    route,
    params,
    opts,
    children,
    placeholder,
    className
  } = props;
  const {get} = useAPIActions();
  const {getCount, getNextParams, getItems, hasMore} = props

  const initialState: ScrollState<T> = {
    items: [],
    scrollParams: params,
    count: null,
    error: null,
    hasMore: true,
    isLoadingPage: null
  }

  const [state, dispatch] = useReducer<Reducer<T>>(infiniteScrollReducer, initialState)

  const loadPage = async <T>(action: LoadPage<T>)=>{
    const page = action.params.page ?? 0
    console.log("Loading page ", page)
    const res = await get(route, action.params, opts)

    const itemVals = getItems(res)
    const ival = page == 0 ? {$set: itemVals} : {$push: itemVals}
    const nextLength = state.items.length + itemVals.length
    const count = getCount(res)
    console.log(`Finished loading page ${page}`)
    // if (state.isLoadingPage == null) {
    //   // We have externally cancelled this request (by e.g. moving to a new results set)
    //   console.log("Loading cancelled")
    //   return
    // }

    action.dispatch({type: "update-state", spec: {
      items: ival,
      scrollParams: {$set: {...params, page: page+1}},
      count: {$set: count},
      hasMore: {$set: hasMore(res) && itemVals.length > 0},
      isLoadingPage: {$set: null}
    }});
  }

  const isInitialRender = useRef(true)
  const loadInitialData = function() {
    // Don't run on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    console.log("Resetting to initial data")
    /*
    Get the initial dataset
    */
    // const success = await get(route, params, opts);
    // parseResponse(success, true)
    //if (state.items.length == 0 && state.isLoadingPage == null) return
    dispatch({type: 'update-state', spec: {$set: initialState}})
    //await loadNext(0)
  };

  useEffect(loadInitialData, [props.route, props.params])
  if (state == null) return null

  //useAsyncEffect(getInitialData, [route, params]);

  //const showLoader = state.isLoadingPage != null && state.items.length > 0

  return h(InfiniteScroll, {
    pageStart: -1,
    loadMore: (page: number)=>{
      dispatch({
        type: "load-page",
        params: state.scrollParams,
        dispatch,
        callback: loadPage
      })
    },
    hasMore: state.hasMore && state.isLoadingPage == null,
    loader: placeholder,
    useWindow: true,
    className
  }, h(APIView, {
      data: state.items,
      route,
      params: state.scrollParams,
      placeholder,
      isLoading: state.isLoadingPage != null,
      totalCount: state.count
    }, children)
  );
};

InfiniteScrollView.defaultProps = {
  hasMore(a, b) { return true }
}

export {InfiniteScrollView};
