import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import axios, {get, post} from 'axios'

APIContext = createContext({})
APIConsumer = APIContext.Consumer

class APIProvider extends Component
  @defaultProps: {
    baseRoute: "/api"
    onError: ->
  }
  render: ->
    {baseURL} = @props
    helpers = {buildURL: @buildURL}
    actions = {post: @post, get: @get}
    value = {actions..., helpers, baseURL}
    h APIContext.Provider, {value}, @props.children

  buildURL: (route, params={})=>
    {baseURL} = @props
    return null unless route?
    p = new URLSearchParams(params).toString()
    if p != ""
      route += "?"+p
    return baseURL+route

  post: (route, params, payload)=>
    {onError} = @props
    if not payload?
      payload = params
      params = {}
    url = @buildURL route, params

    try
      res = await post url, payload
      {data} = res
      if not data?
        onError(route, res)
      return data
    catch err
      onError(route, {error:err})
      return null

  get: (route, params={})=>
    {onError} = @props
    url = @buildURL route, params
    try
      res = await get url
      {data} = res
      if not data?
        onError(route, res)
      return data
    catch err
      onError(route, {error:err})
      return null

export {
  APIContext,
  APIProvider,
  APIConsumer
}

