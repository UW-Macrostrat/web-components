import {APIContext, APIProvider} from "./api"
import InfiniteScroll from 'react-infinite-scroller'
import {useContext, useState, useEffect} from 'react'
import h from '@macrostrat/hyper'
import update from 'immutability-helper'


useImmutableState = (v)->
  [state, setState] = useState(v)
  updateState = (cset)->
    newState = update(state,cset)
    setState(newState)
  return [state, updateState]

useAsyncEffect = (fn,dependencies)->
  vfn = ->
    fn()
    return
  useEffect vfn, dependencies

__InfiniteScrollResultView = (props)->
  {route, params, opts, unwrapResponse, children} = props
  {get} = useContext(APIContext)

  [state, updateState] = useImmutableState({
    items: []
    error: null
  })

  getInitialData = ->
    data = await get(route, params, {unwrapResponse, opts...})
    updateState {items: {$set: data}}
    return

  useAsyncEffect getInitialData, [route,params]

  try
    return h children, {items: state.items}
  catch
    return children(data)

InfiniteScrollResultView = (props)->
  # Enable the use of the APIResultView outside of the APIContext
  # by wrapping it in a placeholder APIContext
  ctx = useContext(APIContext)
  component = h __InfiniteScrollResultView, props
  return component if ctx.get?
  return h APIProvider, {baseURL: ""}, component

export {InfiniteScrollResultView}
