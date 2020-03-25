/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import InfiniteScroll from 'react-infinite-scroller';
import {useContext, useEffect} from 'react';
import h from 'react-hyperscript';
import {APIContext, APIProvider} from "./api";
import {useImmutableState} from './util';
import {useAsyncEffect} from './util';
import {Spinner} from '@blueprintjs/core';

const __InfiniteScrollResultView = function(props){
  /*
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  */
  const {route, params, opts, unwrapResponse, children} = props;
  const {get} = useContext(APIContext);

  const [state, updateState] = useImmutableState({
    items: [],
    scrollId: null,
    count: null,
    error: null
  });
  let {scrollId} = state;

  const getInitialData = async function() {
    /*
    Get the initial dataset
    */
    let data, hits;
    const success = await get(
      route, params, {unwrapResponse, ...opts});

    ({data, scrollId, hits} = success);
    updateState({
      items: {$set: data},
      scrollId: {$set: scrollId},
      count: {$set: hits}
    });
  };

  const loadNext = async function() {
    if (scrollId != null) {
      // Guard against empty scrollid
      let data;
      if (scrollId === "") { return; }
      ({data, scrollId} = await get(route,
        {scroll_id: scrollId},
        {unwrapResponse, ...opts}));
      return updateState({
        items: {$push: data},
        scrollId: {$set: scrollId}
      });
    } else {
      return getInitialData();
    }
  };

  useAsyncEffect(getInitialData, [route,params]);

  let main = null;
  try {
    main = h(children, state);
  } catch (error) {
    main = children(state);
  }

  return h(InfiniteScroll, {
    pageStart: 0,
    loadMore: loadNext,
    hasMore: (scrollId != null) && (scrollId !== ""),
    loader: h(Spinner)
  }, main);
};

const InfiniteScrollResultView = function(props){
  // Enable the use of the APIResultView outside of the APIContext
  // by wrapping it in a placeholder APIContext
  const ctx = useContext(APIContext);
  const component = h(__InfiniteScrollResultView, props);
  if (ctx.get != null) { return component; }
  return h(APIProvider, {baseURL: ""}, component);
};

export {InfiniteScrollResultView};
