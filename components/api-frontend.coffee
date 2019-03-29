import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import axios, {post} from 'axios'
import {Spinner, Button, ButtonGroup,
        Intent, NonIdealState} from '@blueprintjs/core'
import {AppToaster} from './notify'
import ReactJson from 'react-json-view'
import {APIContext} from './api'
import {debounce} from 'underscore'

APIViewContext = createContext({})
APIViewConsumer = APIViewContext.Consumer

class Pagination extends Component
  render: ->
    {currentPage, nextDisabled, setPage} = @props
    h ButtonGroup, [
      h Button, {
        onClick: setPage(currentPage-1)
        icon: 'arrow-left'
        disabled: currentPage <= 0
      }, "Previous"
      h Button, {
        onClick: setPage(currentPage+1)
        rightIcon: 'arrow-right'
        disabled: nextDisabled
      }, "Next"
    ]

class APIResultView extends Component
  @contextType: APIContext
  @defaultProps: {
    route: null
    params: {}
    opts: {} # Options passed to `get`
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
    lazyGetData = debounce @getData, 300
    lazyGetData()

  getData: =>
    {get} = @context
    if not get?
      throw "APIResultView component must inhabit an APIContext"
    {route, params, opts} = @props
    return unless route?
    data = await get(route, params, opts)
    console.log data
    @setState {data}

  render: ->
    {data} = @state
    console.log data
    {children} = @props
    if not children?
      children = (data)=>
        h ReactJson, {src: data}

    if not data?
      return h 'div.api-result-placeholder', [
        h Spinner
      ]
    value = {deleteItem: @deleteItem}
    h APIViewContext.Provider, {value}, (
        children(data)
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
    extraPagination: null
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
    {count} = @state
    nextDisabled = false
    paginationInfo = null
    currentPage = @currentPage()
    lastPage = @lastPage()

    if lastPage?
      if currentPage >= lastPage
        currentPage = lastPage
        nextDisabled = true
      paginationInfo = h 'div', {disabled: true}, [
        "#{currentPage+1} of #{lastPage+1} (#{count} records)"
      ]

    return h 'div.pagination-controls', [
      h Pagination, {currentPage, nextDisabled, setPage: @setPage}
      @props.extraPagination
      paginationInfo
    ]

  lastPage: ->
    {count} = @state
    {perPage} = @props
    return null unless count?
    pages = Math.floor(count/perPage)
    if count%perPage == 0
      pages -= 1
    return pages

  currentPage: ->
    {currentPage} = @state
    lastPage = @lastPage()
    if lastPage? and currentPage >= lastPage
      return lastPage
    return currentPage

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
      params
      rest...
    } = @props

    params ?= {}
    {offset, limit, rest...} = params

    currentPage = @currentPage()
    offset ?= 0
    offset += currentPage*perPage
    if not limit? or limit > perPage
      limit = perPage
    params = {offset, limit, rest...}

    onResponse = (response)=>
      count = getTotalCount(response)
      @setState {count}

    # Options for get
    opts = {onResponse}

    _children = (data)=>
      if @state.count == 0
        return h NonIdealState, {icon: 'search', title: "No results"}
      console.log @state.count, data
      children(data)

    h 'div.pagination-container', rest, [
      @renderPagination() if topPagination
      h APIResultView, {route, params, opts, primaryKey}, _children
      @renderPagination() if bottomPagination
    ]

export {
  APIViewContext, APIViewConsumer,
  APIResultView, PagedAPIView
}
