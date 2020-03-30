/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import InfiniteScroll from 'react-infinite-scroller';
import {useContext, useEffect} from 'react';
import h from 'react-hyperscript';
import {APIContext, APIView, APIResultProps, useAPIActions} from "./api";
import {useImmutableState} from './util';
import {useAsyncEffect} from './util';
import {Spinner} from '@blueprintjs/core';

interface ScrollState<T> {
  items: T[],
  scrollParams: QueryParams,
  count: number,
  error?: any
}

interface InfiniteScrollProps<T> extends APIResultProps<T> {
  getCount(r: T): number,
  getNextParams(r: T, params: QueryParams): QueryParams,
  getItems(r: T): any,
  hasMore(s: ScrollState): boolean
}

const InfiniteScrollView = function<T>(props: InfiniteScrollProps<T>){
  /*
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  */
  const {route, params, opts, children, placeholder} = props;
  const {get} = useAPIActions();
  const {getCount, getNextParams, getItems, hasMore} = props

  const initialState: ScrollState<T> = {
    items: [],
    scrollParams: params,
    count: null,
    error: null
  }

  const [state, updateState] = useImmutableState(initialState);

  const parseResponse = (res: T)=>{
    updateState({
      items: {$push: getItems(res)},
      scrollParams: {$set: getNextParams(res, params)},
      count: {$set: getCount(res)}
    });
  }

  // useEffect(()=>{
  //   updateState({$set: initialState})
  // }, [route, params])

  const getInitialData = async function() {
    /*
    Get the initial dataset
    */
    const success = await get(route, params, opts);
    parseResponse(success)
  };

  const loadNext = async function() {
    // if (state.scrollParams == null && state.items == []) {
    //   getInitialData()
    //   return
    // }
    console.log("Loading next page...")
    const success = await get(route, state.scrollParams, opts)
    parseResponse(success)
  };

  useAsyncEffect(getInitialData, [route, params]);

  const {items} = state
  return h(InfiniteScroll, {
    pageStart: 0,
    loadMore: loadNext,
    hasMore: hasMore(state),
    loader: h(Spinner)
  }, h(APIView, {
      data: items,
      route,
      params: state.scrollParams,
      placeholder
    }, children)
  );
};

export {InfiniteScrollView};
