import {Component, createContext, useState, useContext} from 'react'
import h from 'react-hyperscript'
import {memoize} from 'underscore'
import axios from 'axios'
import useAsyncEffect from 'use-async-effect'

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
    {baseURL, unwrapResponse, onError, rest...} = @props
    helpers = {@buildURL, buildQueryString, @processOptions}
    actions = {post: @post, get: @get}
    value = {rest..., actions..., helpers, baseURL, onError}
    h APIContext.Provider, {value}, @props.children

  buildURL: (route, params={})=>
    {baseURL} = @props
    return null unless route?
    console.log route

    if not (route.startsWith(baseURL) or route.startsWith('http'))
      route = baseURL+route
    route += buildQueryString(params)
    return route

  post: =>
    if arguments.length == 4
      [route, params, payload, opts] = arguments
    else if arguments.length == 3
      [route, payload, opts] = arguments
    else if arguments.length == 2
      [route, payload] = arguments
    else
      throw "No data to post"
    opts ?= {}
    params ?= {}

    url = @buildURL route, params
    opts = @processOptions opts

    @runQuery(axios.post(url, payload), route, url, "POST", opts)

  get: (route, params, opts)=>
    params ?= {}
    if not opts?
      opts = params
      params = {}

    url = @buildURL route, params
    opts = @processOptions opts

    fn = axios.get
    if opts.memoize
      fn = memoize(axios.get)

    @runQuery(fn(url), route, url, "GET", opts)

  runQuery: (promise, route, url, method, opts)=>
    {onError} = opts
    try
      res = await promise
      opts.onResponse(res)
      {data} = res
      if not data?
        throw res.error or "No data!"
      return opts.unwrapResponse(data)
    catch err
      if not opts.handleError
        throw err
      console.error err
      onError(route, {
        error:err,
        response: res,
        endpoint: url,
        method
      })
      return null

  processOptions: (opts={})=>
    # Standardize option values
    # (some props can be passed as options)
    opts.fullResponse ?= false
    opts.handleError ?= true
    opts.memoize ?= false
    opts.onError ?= @props.onError
    # Run some side effects with the response (e.g. process headers)
    opts.onResponse ?= ->
    opts.unwrapResponse ?= @props.unwrapResponse

    if opts.fullResponse
      opts.unwrapResponse = (data)->data

    return opts

useAPIResult = (route, params, opts={})->
  ###
  React hook for API results
  ###
  [result, setResult] = useState(null)
  {get} = useContext(APIContext)
  getAPIData = ->
    res = await get(route, params, {opts...})
    setResult(res)

  useAsyncEffect(getAPIData, [])
  return result

export {
  APIContext,
  APIProvider,
  APIConsumer,
  buildQueryString,
  useAPIResult
}
