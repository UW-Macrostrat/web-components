import InfiniteScroll from 'react-infinite-scroller';
import h from 'react-hyperscript';
import update, {Spec} from 'immutability-helper'
import {useReducer, useEffect, useRef} from 'react'
//import { VariableSizeList as List } from 'react-window'
import {Virtuoso} from 'react-virtuoso'

import {APIView, APIResultProps, useAPIActions} from "./api";

interface ScrollState<T=object> {
  items: T[],
  scrollParams: APIParams,
  count: number|null,
  error?: any,
  hasMore: boolean,
  isLoadingPage: number|null
}

type ScrollResponseItems<T> = Pick<ScrollState<T>,'count'|'hasMore'|'items'>

interface InfiniteScrollProps<T> extends Omit<APIResultProps<T>,"params"> {
  getCount(r: T): number,
  getNextParams(r: T, params: QueryParams): QueryParams,
  getItems(r: T): any,
  hasMore(res: T): boolean,
  totalCount?: number,
  // Only allow more restrictive parameter types
  params: APIParams,
  className?: string
}

type UpdateState<T> = {type: 'update-state', spec: Spec<ScrollState<T>>}
type LoadNextPage = {
  type: 'load-next-page',
  page: number
}
type LoadPage<T> = {
  type: 'load-page',
  params: APIParams,
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

  const loadPage = async (action: LoadPage<T>)=>{
    const page = (action.params.page as number) ?? 0
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

    let p1 = {...params, page: page+1}

    action.dispatch({type: "update-state", spec: {
      items: ival,
      scrollParams: {$set: p1},
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

  const loadMore = (page: number)=>{
    dispatch({
      type: "load-page",
      params: state.scrollParams,
      dispatch,
      callback: loadPage
    })
  }

  return h(InfiniteScroll, {
    pageStart: -1,
    loadMore,
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
      totalCount: props.totalCount ?? state.count
    }, children)
  );
};

InfiniteScrollView.defaultProps = {
  hasMore(a, b) { return true }
}

interface WindowedParams {
  renderItem(index: number): React.ReactNode,
}

type WindowedProps<T> = InfiniteScrollProps<T> & WindowedParams
type InnerProps = WindowedParams & {data: object[]}

const WindowedScrollInner = (props: InnerProps)=>{
  const {renderItem, data} = props
  return h(Virtuoso, {
    item: renderItem,
    totalCount: 200,
    style: {width: "100vw"}
  })
}


const WindowedScrollView = <T>(props: WindowedProps<T>)=>{
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

  const loadPage = async (action: LoadPage<T>)=>{
    const page = (action.params.page as number) ?? 0
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

    let p1 = {...params, page: page+1}

    action.dispatch({type: "update-state", spec: {
      items: ival,
      scrollParams: {$set: p1},
      count: {$set: count},
      hasMore: {$set: hasMore(res) && itemVals.length > 0},
      isLoadingPage: {$set: null}
    }});
  }

  const loadMore = ()=>{
    dispatch({
      type: "load-page",
      params: state.scrollParams,
      dispatch,
      callback: loadPage
    })
  }

  const isInitialRender = useRef(true)
  const loadInitialData = function() {
    // Don't run on initial render
    if (isInitialRender.current) {
      loadMore()
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
    loadMore()
  };

  useEffect(loadInitialData, [props.route, props.params])
  if (state == null) return null

  //useAsyncEffect(getInitialData, [route, params]);

  //const showLoader = state.isLoadingPage != null && state.items.length > 0


  const item = (index)=>{
    return renderItem(index, state.items[index])
  }

  const {renderItem, footer, ...rest} = props
  return h(APIView, {
    data: state.items,
    route,
    params: state.scrollParams,
    placeholder,
    isLoading: state.isLoadingPage != null,
    totalCount: props.totalCount ?? state.count
  }, h(Virtuoso, {
    item,
    totalCount: state.items.length,
    style: {height: '100vh'},
    endReached: loadMore,
    footer
  }))
}

export {InfiniteScrollView, WindowedScrollView};
