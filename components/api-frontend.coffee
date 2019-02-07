import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import axios, {post} from 'axios'
import {Spinner, Button, ButtonGroup, Intent, NonIdealState} from '@blueprintjs/core'
import {AppToaster} from './notify'
import {APIContext} from './api'

APIViewContext = createContext({})
APIViewConsumer = APIViewContext.Consumer

class APIResultView extends Component
  @contextType: APIContext
  @defaultProps: {
    route: null
    params: {}
    debug: false
    success: console.log
    primaryKey: 'id'
  }
  constructor: ->
    super arguments...
    @state = {data: null}
    @getData()

  buildURL: (props)=>
    props ?= @props
    {helpers: {buildURL}} = @context
    {route, params} = props
    buildURL route, params

  componentDidUpdate: (prevProps)->
    return if @buildURL() == @buildURL(prevProps)
    @getData()

  getData: ->
    {get} = @context
    if not get?
      throw "APIResultView component must inhabit an APIContext"
    {success, route, params} = @props
    return unless route?
    console.log route
    # Get the full response instead of just the data
    response = await get(route, params, true)
    {data} = response
    @setState {data}
    success response

  render: ->
    {data} = @state
    if not data?
      return h 'div.api-result-placeholder', [
        h Spinner
      ]
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
    topPagination: false
    bottomPagination: true
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
    paginationInfo = null
    if count?
      lastPage = Math.floor(count/perPage)
      if currentPage >= lastPage
        nextDisabled = true
      paginationInfo = h 'div', {disabled: true}, [
        "#{currentPage+1} of #{lastPage+1}"
      ]

    return h 'div.pagination-controls', [
      h ButtonGroup, [
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
      paginationInfo
    ]


  render: ->
    {
      route,
      perPage,
      children,
      getTotalCount,
      primaryKey,
      count
      topPagination
      bottomPagination
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
      @renderPagination() if topPagination
      h APIResultView, {route, params, success, primaryKey}, children
      @renderPagination() if bottomPagination
    ]

export {
  APIViewContext, APIViewConsumer,
  APIResultView, PagedAPIView
}
