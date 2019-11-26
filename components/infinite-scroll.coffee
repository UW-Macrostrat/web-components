import InfiniteScroll from 'react-infinite-scroller'
import {useContext, useEffect} from 'react'
import h from 'react-hyperscript'
import {APIContext, APIProvider} from "./api"
import {useImmutableState} from './util'
import {useAsyncEffect} from './util'
import {Spinner} from '@blueprintjs/core'

__InfiniteScrollResultView = (props)->
  ###
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  ###
  {route, params, opts, unwrapResponse, children} = props
  {get} = useContext(APIContext)

  [state, updateState] = useImmutableState({
    items: []
    scrollId: null
    hits: null
    error: null
  })
  {scrollId} = state

  getInitialData = ->
    ###
    Get the initial dataset
    ###
    success = await get(
      route, params, {unwrapResponse, opts...})

    {data, scrollId, hits} = success
    updateState {
      items: {$set: data}
      scrollId: {$set: scrollId}
      hits: {$set: hits}
    }
    return

  loadNext = ->
    if scrollId?
      # Guard against empty scrollid
      return if scrollId == ""
      {data, scrollId} = await get(route,
        {scroll_id: scrollId},
        {unwrapResponse, opts...})
      updateState {
        items: {$push: data}
        scrollId: {$set: scrollId}
      }
    else
      getInitialData()

  useAsyncEffect getInitialData, [route,params]

  main = null
  try
    main = h(children, {items: state.items})
  catch
    main = children(respose.data)

  h InfiniteScroll, {
    pageStart: 0,
    loadMore: loadNext
    hasMore: scrollId? and scrollId != ""
    loader: h(Spinner)
  }, main

InfiniteScrollResultView = (props)->
  # Enable the use of the APIResultView outside of the APIContext
  # by wrapping it in a placeholder APIContext
  ctx = useContext(APIContext)
  component = h __InfiniteScrollResultView, props
  return component if ctx.get?
  return h APIProvider, {baseURL: ""}, component

export {InfiniteScrollResultView}
