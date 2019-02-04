import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import axios, {get, post} from 'axios'
import {Spinner, Button, ButtonGroup, Intent, NonIdealState} from '@blueprintjs/core'
import {AppToaster} from './notify'

APIContext = createContext({})
APIConsumer = APIContext.Consumer

class APIProvider extends Component
  @defaultProps: {
    baseRoute: "/api"
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
    {baseURL} = @props
    if not payload?
      payload = params
      params = {}
    url = @buildURL route, params

    res = await post url, payload
    {data} = res
    return data

  get: (route, params={})=>
    url = @buildURL route, params
    {data: result} = await get url
    return result

export {
  APIContext,
  APIProvider,
  APIConsumer
}

