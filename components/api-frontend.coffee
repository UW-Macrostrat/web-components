import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import axios, {get, post} from 'axios'
import {Spinner, Button, ButtonGroup, Intent, NonIdealState} from '@blueprintjs/core'
import {AppToaster} from './notify'
import {APIContext} from './api'

APIViewContext = createContext({})
APIViewConsumer = APIViewContext.Consumer

class APIResultView extends Component
  @defaultProps: {
    route: null
    params: {}
    debug: false
    success: console.log
    primaryKey: 'id'
  }
  constructor: ->
    super arguments...
    @state = {response: null}
    @getData()

  buildURL: (props)=>
    props ?= @props
    {route, params} = props
    return null unless route?
    p = new URLSearchParams(params).toString()
    if p != ""
      route += "?"+p
    return route

  componentDidUpdate: (prevProps)->
    return if @buildURL() == @buildURL(prevProps)
    @getData()

  getData: ->
    {success} = @props
    route = @buildURL()
    return unless route?
    response = await get(route)
    @setState {response}
    success response

  render: ->
    {response} = @state
    if not response?
      return h Spinner
    {data} = response

    value = {deleteItem: @deleteItem}
    h APIViewContext.Provider, {value}, (
        @props.children(data)
    )

  deleteItem: (data)=>
    {route, primaryKey} = @props
    id = data[primaryKey]
    itemRoute = route+"/#{id}"
    try
      res = await axios.delete(itemRoute)
      @getData()
    catch err
      {message} = err
      if err.response.status == 403
        message = err.response.data.message
      intent = Intent.DANGER
      AppToaster.show {message, intent}

class PagedAPIView extends Component
  @defaultProps: {
    count: null
    perPage: 20
    getTotalCount: (response)->
      {headers} = response
      return parseInt(headers['x-total-count'])
  }
  constructor: (props)->
    super props
    @state = {currentPage: 0, count: null}

  setPage: (i)=> =>
    @setState {currentPage: i}

  renderPagination: ->
    {perPage} = @props
    {currentPage, count} = @state
    nextDisabled = false
    if count?
      lastPage = Math.floor(count/perPage)
      if currentPage >= lastPage
        nextDisabled = true

    return h ButtonGroup, [
      h Button, {
        onClick: @setPage(currentPage-1)
        icon: 'arrow-left'
        disabled: currentPage == 0
      }, "Previous"
      h Button, {
        onClick: @setPage(currentPage+1)
        rightIcon: 'arrow-right'
        disabled: nextDisabled
      }, "Next"
    ]


  render: ->
    {
      route,
      perPage,
      children,
      getTotalCount,
      primaryKey,
      count
      rest...
    } = @props
    {currentPage} = @state

    offset = currentPage*perPage
    limit = perPage
    params = {offset, limit}

    success = (response)=>
      count = getTotalCount(response)
      @setState {count}

    h 'div.pagination-container', rest, [
      h APIResultView, {route, params, success, primaryKey}, children
      @renderPagination()
    ]

export {
  APIViewContext, APIViewConsumer,
  APIResultView, PagedAPIView
}
