import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {get} from 'axios'
import {Spinner, Button, ButtonGroup} from '@blueprintjs/core'

class APIResultView extends Component
  @Context: createContext({})
  @defaultProps: {
    route: null
    params: {}
    debug: false
    success: console.log
  }
  constructor: ->
    super arguments...
    @state = {response: null}
    @getData()

  componentDidUpdate: (prevProps)->
    return if prevProps.route == @props.route
    @getData()

  getData: ->
    {route, params, success} = @props
    throw "API route undefined" unless route?
    p = new URLSearchParams(params).toString()
    if p != ""
      route += "?"+p

    response = await get(route)
    @setState {response}
    success response

  render: ->
    {response} = @state
    if not response?
      return h Spinner
    {data} = response
    @props.children(data)

class PagedAPIView extends Component
  @defaultProps: {
    count: null
    perPage: 20
    getTotalCount: (response)->
      {headers} = response
      console.log parseInt(headers['x-total-count'])
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
      rest...
    } = @props
    {currentPage} = @state

    offset = currentPage*perPage
    limit = perPage
    params = {}

    success = (response)=>
      count = getTotalCount(response)
      @setState {count}

    h 'div.pagination-container', rest, [
      h APIResultView, {route, params, success}, children
      @renderPagination()
    ]


export {APIResultView, PagedAPIView}
