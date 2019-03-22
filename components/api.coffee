import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import axios, {get, post} from 'axios'

APIContext = createContext({})
APIConsumer = APIContext.Consumer

buildQueryString = (params={})=>
  p = new URLSearchParams(params).toString()
  if p != ""
    p = "?"+p
  return p

class APIProvider extends Component
  @defaultProps: {
    baseURL: "/api"
    unwrapResponse: (res)->res
    onError: (route, opts)->
      # This is a non-intuitive signature
      {error} = opts
      if not error?
        error = opts
      throw error
  }
  render: ->
    {baseURL} = @props
    helpers = {buildURL: @buildURL, buildQueryString}
    actions = {post: @post, get: @get}
    value = {actions..., helpers, baseURL}
    h APIContext.Provider, {value}, @props.children

  buildURL: (route, params={})=>
    {baseURL} = @props
    return null unless route?
    console.log route

    if not (route.startsWith(baseURL) or route.startsWith('http'))
      route = baseURL+route
    route += buildQueryString(params)
    return route

  post: (route, params, payload, opts)=>
    if not payload?
      opts = payload
      payload = params
      params = {}

    url = @buildURL route, params
    @runQuery(post(url, payload), opts)

  get: (route, params, opts)=>
    params ?= {}
    if not opts?
      opts = params
      params = {}

    url = @buildURL route, params
    @runQuery(get(url), opts)

  runQuery: (fn, opts)=>
    opts = @processOptions opts
    {onError} = opts
    try
      res = await fn
      {data} = res
      if not data?
        throw res.error or "No data!"
      if opts.fullResponse
        return res
      return opts.unwrapResponse(data)
    catch err
      onError(route, {error:err, response: res})
      return null

  processOptions: (opts={})=>
    # Standardize option values
    # (some props can be passed as options)
    opts.fullResponse ?= false
    opts.onError ?= @props.onError
    opts.unwrapResponse ?= @props.unwrapResponse
    return opts

export {
  APIContext,
  APIProvider,
  APIConsumer,
  buildQueryString
}

