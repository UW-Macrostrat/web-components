import InfiniteScroll from 'react-infinite-scroller';
import h from 'react-hyperscript';
import update, {Spec} from 'immutability-helper'
import {useReducer, useEffect} from 'react'

import {APIView, APIResultProps, useAPIActions} from "./api";
import {useAsyncEffect} from './util';

interface ScrollState<T=object> {
  items: T[],
  scrollParams: QueryParams,
  count: number,
  error?: any,
  hasMore: boolean,
  isLoadingPage: number|null
}

interface InfiniteScrollProps<T> extends APIResultProps<T> {
  getCount(r: T): number,
  getNextParams(r: T, params: QueryParams): QueryParams,
  getItems(r: T): any,
  hasMore(s: ScrollState<T>, res: T): boolean,
}

type UpdateState<T> = {type: 'update-state', spec: Spec<ScrollState<T>>}
type LoadPage = {type: 'load-page', page: number}

type ScrollAction<T> =
  | UpdateState<T>
  | LoadPage

type Reducer<T> = (state: ScrollState<T>, action: ScrollAction<T>)=>ScrollState<T>

const infiniteScrollReducer = function<T>(state: ScrollState<T>, action: ScrollAction<T>) {
  switch (action.type) {
  case "update-state":
    return update(state, action.spec)
  case "load-page":
    return update(state, {isLoadingPage: {$set: action.page}})
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


  const parseResponse = (res: T, page: number)=>{
    const itemVals = getItems(res)
    const ival = page == 0 ? {$set: itemVals} : {$push: itemVals}
    const nextLength = state.items.length + itemVals.length
    const count = getCount(res)
    console.log(`Finished loading page ${page}`)
    dispatch({type: "update-state", spec: {
      items: ival,
      scrollParams: {$set: {...params, page: page+1}},
      count: {$set: count},
      hasMore: {$set: hasMore(state, res) && itemVals.length > 0 && nextLength <= count},
      isLoadingPage: {$set: null}
    }});
  }

  const loadNext = async function(page: number) {
    console.log("Loading page ", page)
    dispatch({type: "update-state", spec: {isLoadingPage: {$set: page}}})
    const success = await get(route, state.scrollParams, opts)
    parseResponse(success, page)
  };

  const loadInitialData = function() {
    /*
    Get the initial dataset
    */
    // const success = await get(route, params, opts);
    // parseResponse(success, true)
    if (state.items.length == 0 && state.isLoadingPage == null) return
    dispatch({type: 'update-state', spec: {$set: initialState}})
    //await loadNext(0)
  };

  useEffect(loadInitialData, [props.route, props.params])
  if (state == null) return null

  //useAsyncEffect(getInitialData, [route, params]);

  //const showLoader = state.isLoadingPage != null && state.items.length > 0

  return h(InfiniteScroll, {
    pageStart: 0,
    loadMore: loadNext,
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
