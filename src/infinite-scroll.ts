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
  error?: any,
  hasMore: boolean
}

interface InfiniteScrollProps<T> extends APIResultProps<T> {
  getCount(r: T): number,
  getNextParams(r: T, params: QueryParams): QueryParams,
  getItems(r: T): any,
  hasMore(s: ScrollState<T>, res: T): boolean,
}

const InfiniteScrollView = function<T>(props: InfiniteScrollProps<T>){
  /*
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  */
  const {route, params, opts, children, placeholder, className} = props;
  const {get} = useAPIActions();
  const {getCount, getNextParams, getItems, hasMore} = props

  const initialState: ScrollState<T> = {
    items: [],
    scrollParams: params,
    count: null,
    error: null,
    hasMore: true,
  }

  const [state, updateState] = useImmutableState(initialState);

  const parseResponse = (res: T, page: number)=>{
    const itemVals = getItems(res)
    const ival = page == 0 ? {$set: itemVals} : {$push: itemVals}
    const nextLength = state.items.length + itemVals.length
    const count = getCount(res)
    updateState({
      items: ival,
      scrollParams: {$set: {...params, page: page+1}},
      count: {$set: count},
      hasMore: {$set: hasMore(state, res) && itemVals.length > 0 && nextLength <= count}
    });
  }

  const loadNext = async function(page: number) {
    console.log("Loading page ", page)
    const success = await get(route, state.scrollParams, opts)
    parseResponse(success, page)
  };

  const loadInitialData = async function() {
    /*
    Get the initial dataset
    */
    // const success = await get(route, params, opts);
    // parseResponse(success, true)
    updateState({$set: initialState})
    //await loadNext(0)
  };

  //loadInitialData()
  useAsyncEffect(loadInitialData, [props.route, props.params])

  //useAsyncEffect(getInitialData, [route, params]);

  return h(InfiniteScroll, {
    pageStart: 0,
    loadMore: loadNext,
    hasMore: state.hasMore,
    loader:  state.items.length == 0 ? null : placeholder,
    useWindow: true,
    className
  }, h(APIView, {
      data: state.items,
      route,
      params: state.scrollParams,
      placeholder
    }, children)
  );
};

InfiniteScrollView.defaultProps = {
  hasMore(a, b) { return true }
}

export {InfiniteScrollView};
